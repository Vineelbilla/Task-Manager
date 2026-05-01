const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const cleanupOrphanTasks = require("../utils/cleanupOrphanTasks");

const createProject = async (req, res, next) => {
  try {
    const { name, description, members = [] } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: "Project name and description are required" });
    }

    const uniqueMembers = [...new Set([req.user._id.toString(), ...members])];

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: uniqueMembers,
    });

    const populatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role")
      .populate("members", "name email role");

    return res.status(201).json(populatedProject);
  } catch (error) {
    next(error);
  }
};

const getProjects = async (req, res, next) => {
  try {
    const query =
      req.user.role === "Admin"
        ? {
            $or: [{ createdBy: req.user._id }, { members: req.user._id }],
          }
        : { members: req.user._id };

    const projects = await Project.find(query)
      .populate("createdBy", "name email role")
      .populate("members", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

const addMemberToProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid project or user id" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the project creator can add members" });
    }

    const user = await User.findById(userId).select("name email role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyMember = project.members.some((memberId) => memberId.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ message: "User is already a project member" });
    }

    project.members.push(userId);
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role")
      .populate("members", "name email role");

    return res.status(200).json(updatedProject);
  } catch (error) {
    next(error);
  }
};

const updateProjectMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { members = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    if (!Array.isArray(members)) {
      return res.status(400).json({ message: "Members must be provided as an array" });
    }

    const invalidMemberId = members.find((memberId) => !mongoose.Types.ObjectId.isValid(memberId));
    if (invalidMemberId) {
      return res.status(400).json({ message: "One or more member ids are invalid" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the project creator can edit members" });
    }

    const uniqueMembers = [...new Set([req.user._id.toString(), ...members])];
    const existingUsers = await User.find({ _id: { $in: uniqueMembers } }).select("_id");

    if (existingUsers.length !== uniqueMembers.length) {
      return res.status(404).json({ message: "One or more selected users were not found" });
    }

    project.members = uniqueMembers;
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role")
      .populate("members", "name email role");

    return res.status(200).json(updatedProject);
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    if (!name || !description) {
      return res.status(400).json({ message: "Project name and description are required" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the project creator can edit this project" });
    }

    project.name = name.trim();
    project.description = description.trim();
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role")
      .populate("members", "name email role");

    return res.status(200).json(updatedProject);
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the project creator can delete this project" });
    }

    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();
    await cleanupOrphanTasks();

    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  addMemberToProject,
  updateProjectMembers,
  updateProject,
  deleteProject,
};
