const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const cleanupOrphanTasks = require("../utils/cleanupOrphanTasks");

const createTask = async (req, res, next) => {
  try {
    const { title, description, projectId, assignedTo, status, dueDate } = req.body;

    if (!title || !description || !projectId || !assignedTo || !dueDate) {
      return res.status(400).json({
        message: "Title, description, project, assignee, and due date are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(assignedTo)
    ) {
      return res.status(400).json({ message: "Invalid project or assignee id" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the project creator can create tasks" });
    }

    const isMember = project.members.some((memberId) => memberId.toString() === assignedTo);
    if (!isMember) {
      return res.status(400).json({ message: "Assignee must be a project member" });
    }

    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      return res.status(404).json({ message: "Assignee not found" });
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      createdBy: req.user._id,
      assignedTo,
      status: ["TODO", "IN_PROGRESS", "DONE"].includes(status) ? status : "TODO",
      dueDate,
      completedAt: status === "DONE" ? new Date() : null,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("projectId", "name description")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role");

    return res.status(201).json(populatedTask);
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    await cleanupOrphanTasks();

    const { project, user, status, dueDate } = req.query;
    const query = {};
    let requestedProjectId = null;

    if (project) {
      if (!mongoose.Types.ObjectId.isValid(project)) {
        return res.status(400).json({ message: "Invalid project id" });
      }
      requestedProjectId = project;
    }

    if (user) {
      if (!mongoose.Types.ObjectId.isValid(user)) {
        return res.status(400).json({ message: "Invalid user id" });
      }
      query.assignedTo = user;
    }

    if (status && ["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
      query.status = status;
    }

    if (dueDate) {
      const parsedDate = new Date(dueDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid due date filter" });
      }

      const nextDay = new Date(parsedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.dueDate = { $gte: parsedDate, $lt: nextDay };
    }

    const membershipQuery =
      req.user.role === "Admin"
        ? { $or: [{ createdBy: req.user._id }, { members: req.user._id }] }
        : { members: req.user._id };

    const accessibleProjects = await Project.find(membershipQuery).select("_id");
    const projectIds = accessibleProjects.map((projectItem) => projectItem._id);

    if (requestedProjectId) {
      const accessibleProject = projectIds.find((id) => id.toString() === requestedProjectId);
      if (!accessibleProject) {
        return res.status(200).json([]);
      }

      query.projectId = accessibleProject;
    } else {
      query.projectId = { $in: projectIds };
    }

    if (req.user.role === "Member" && !user) {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate("projectId", "name description")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .sort({ dueDate: 1, createdAt: -1 });

    return res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, status, dueDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: "Related project not found" });
    }

    const isProjectMember = project.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );
    if (!isProjectMember && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You do not have access to this task" });
    }

    if (req.user.role === "Member") {
      if (task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Members can update only their assigned tasks" });
      }

      if (!status || !["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
        return res.status(400).json({ message: "Members can only update task status" });
      }

      task.status = status;
    } else {
      if (title) {
        task.title = title;
      }
      if (description) {
        task.description = description;
      }
      if (dueDate) {
        task.dueDate = dueDate;
      }
      if (status && ["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
        task.status = status;
      }
      if (assignedTo) {
        if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
          return res.status(400).json({ message: "Invalid assignee id" });
        }

        const validAssignee = project.members.some(
          (memberId) => memberId.toString() === assignedTo.toString()
        );
        if (!validAssignee) {
          return res.status(400).json({ message: "Assignee must be a project member" });
        }

        task.assignedTo = assignedTo;
      }
    }

    if (task.status === "DONE" && !task.completedAt) {
      task.completedAt = new Date();
    }

    if (task.status !== "DONE") {
      task.completedAt = null;
    }

    // Preserve compatibility with older tasks created before createdBy existed.
    if (!task.createdBy) {
      task.createdBy = project.createdBy || req.user._id;
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("projectId", "name description")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role");

    return res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: "Related project not found" });
    }

    const isProjectMember = project.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );
    if (!isProjectMember && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You do not have access to this task" });
    }

    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only admins can delete tasks" });
    }

    await task.deleteOne();

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    await cleanupOrphanTasks();

    const now = new Date();

    if (req.user.role === "Admin") {
      const [totalTasks, completedTasks, overdueTasks, createdByMe, recentTasks, allTasks] =
        await Promise.all([
          Task.countDocuments(),
          Task.countDocuments({ status: "DONE" }),
          Task.countDocuments({ dueDate: { $lt: now }, status: { $ne: "DONE" } }),
          Task.countDocuments({ createdBy: req.user._id }),
          Task.find()
            .populate("projectId", "name")
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role")
            .sort({ createdAt: -1 })
            .limit(5),
          Task.find()
            .populate("projectId", "name")
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role")
            .sort({ dueDate: 1, createdAt: -1 }),
        ]);

      return res.status(200).json({
        role: "Admin",
        stats: {
          totalTasks,
          completedTasks,
          overdueTasks,
          createdByMe,
        },
        recentTasks,
        allTasks,
      });
    }

    const memberFilter = { assignedTo: req.user._id };
    const [totalTasks, completedTasks, overdueTasks, assignedTasks] = await Promise.all([
      Task.countDocuments(memberFilter),
      Task.countDocuments({ ...memberFilter, status: "DONE" }),
      Task.countDocuments({
        ...memberFilter,
        dueDate: { $lt: now },
        status: { $ne: "DONE" },
      }),
      Task.find(memberFilter)
        .populate("projectId", "name")
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .sort({ dueDate: 1, createdAt: -1 }),
    ]);

    return res.status(200).json({
      role: "Member",
      stats: {
        totalTasks,
        completedTasks,
        overdueTasks,
        assignedToMe: assignedTasks.length,
      },
      assignedTasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getDashboard,
};
