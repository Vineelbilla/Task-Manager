const Task = require("../models/Task");
const User = require("../models/User");
const Project = require("../models/Project");
const cleanupOrphanTasks = require("../utils/cleanupOrphanTasks");

const getUserStats = async (req, res, next) => {
  try {
    await cleanupOrphanTasks();

    const [users, aggregatedStats] = await Promise.all([
      User.find().select("name email role").sort({ name: 1 }),
      Task.aggregate([
        {
          $group: {
            _id: "$assignedTo",
            totalTasksAssigned: { $sum: 1 },
            tasksCompleted: {
              $sum: {
                $cond: [{ $eq: ["$status", "DONE"] }, 1, 0],
              },
            },
            tasksPending: {
              $sum: {
                $cond: [{ $ne: ["$status", "DONE"] }, 1, 0],
              },
            },
            projectIds: { $addToSet: "$projectId" },
          },
        },
      ]),
    ]);

    const statsMap = new Map(
      aggregatedStats.map((item) => [
        item._id?.toString(),
        {
          totalTasksAssigned: item.totalTasksAssigned,
          tasksCompleted: item.tasksCompleted,
          tasksPending: item.tasksPending,
          projectsInvolved: item.projectIds.length,
        },
      ])
    );

    const userStats = users.map((user) => {
      const stats = statsMap.get(user._id.toString()) || {
        totalTasksAssigned: 0,
        tasksCompleted: 0,
        tasksPending: 0,
        projectsInvolved: 0,
      };

      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...stats,
      };
    });

    return res.status(200).json(userStats);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof name === "string") {
      if (!name.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }
      user.name = name.trim();
    }

    if (typeof email === "string") {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
        return res.status(400).json({ message: "Please provide a valid email" });
      }

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return res.status(409).json({ message: "Email is already in use" });
      }

      user.email = normalizedEmail;
    }

    if (typeof role === "string") {
      if (!["Admin", "Member"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      if (
        user.role === "Admin" &&
        req.user._id.toString() !== user._id.toString() &&
        role !== "Admin"
      ) {
        return res.status(403).json({ message: "Other admin accounts cannot be demoted" });
      }

      if (req.user._id.toString() === user._id.toString() && role !== "Admin") {
        return res.status(400).json({ message: "You cannot remove your own admin access" });
      }

      user.role = role;
    }

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "Admin") {
      return res.status(403).json({ message: "Admin accounts cannot be deleted" });
    }

    const ownedProjects = await Project.find({ createdBy: user._id }).select("_id");
    const ownedProjectIds = ownedProjects.map((project) => project._id);

    if (ownedProjectIds.length) {
      await Task.deleteMany({ projectId: { $in: ownedProjectIds } });
      await Project.deleteMany({ _id: { $in: ownedProjectIds } });
    }

    await Project.updateMany({ members: user._id }, { $pull: { members: user._id } });
    await Task.deleteMany({
      $or: [{ createdBy: user._id }, { assignedTo: user._id }],
    });
    await user.deleteOne();
    await cleanupOrphanTasks();

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserStats,
  updateUser,
  deleteUser,
};
