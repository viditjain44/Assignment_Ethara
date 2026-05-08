const router = require('express').Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const now = new Date();

    // Projects user belongs to
    const projectFilter = req.user.role === 'admin'
      ? {}
      : { 'members.user': req.user._id };
    const projects = await Project.find(projectFilter).select('_id name status');
    const projectIds = projects.map((p) => p._id);

    // Tasks in those projects
    const taskFilter = req.user.role === 'admin'
      ? {}
      : { project: { $in: projectIds } };

    const [taskStats, myTasks, overdueTasks, recentTasks] = await Promise.all([
      // Task breakdown by status
      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Tasks assigned to me
      Task.find({ ...taskFilter, assignee: req.user._id, status: { $ne: 'done' } })
        .populate('project', 'name')
        .sort({ dueDate: 1 })
        .limit(10),

      // Overdue tasks
      Task.find({ ...taskFilter, dueDate: { $lt: now }, status: { $ne: 'done' } })
        .populate('assignee', 'name avatar')
        .populate('project', 'name')
        .sort({ dueDate: 1 })
        .limit(10),

      // Recently updated tasks
      Task.find(taskFilter)
        .populate('assignee', 'name avatar')
        .populate('project', 'name')
        .sort({ updatedAt: -1 })
        .limit(10),
    ]);

    // Map status counts
    const statusMap = { todo: 0, in_progress: 0, review: 0, done: 0 };
    taskStats.forEach(({ _id, count }) => { if (_id in statusMap) statusMap[_id] = count; });

    const totalTasks = Object.values(statusMap).reduce((a, b) => a + b, 0);

    res.json({
      summary: {
        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.status === 'active').length,
        totalTasks,
        ...statusMap,
        overdueCount: overdueTasks.length,
      },
      myTasks,
      overdueTasks,
      recentTasks,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;