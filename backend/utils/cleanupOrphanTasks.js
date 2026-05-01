const Task = require("../models/Task");

const cleanupOrphanTasks = async () => {
  const orphanTasks = await Task.aggregate([
    {
      $lookup: {
        from: "projects",
        localField: "projectId",
        foreignField: "_id",
        as: "projectMatch",
      },
    },
    {
      $match: {
        projectMatch: { $size: 0 },
      },
    },
    {
      $project: {
        _id: 1,
      },
    },
  ]);

  if (!orphanTasks.length) {
    return 0;
  }

  const orphanTaskIds = orphanTasks.map((task) => task._id);
  await Task.deleteMany({ _id: { $in: orphanTaskIds } });

  return orphanTaskIds.length;
};

module.exports = cleanupOrphanTasks;
