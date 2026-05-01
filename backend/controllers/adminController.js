const Task = require("../models/Task");
const User = require("../models/User");
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

module.exports = {
  getUserStats,
};
