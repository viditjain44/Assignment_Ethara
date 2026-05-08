const router = require('express').Router();
const { body, query } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { projectAccess } = require('../middleware/projectAccess');
const validate = require('../middleware/validate');

router.use(protect);

// GET /api/tasks?project=&status=&priority=&assignee=&overdue=true
router.get('/', async (req, res) => {
  try {
    const filter = {};

    // Scope to projects user belongs to (unless global admin)
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
      filter.project = { $in: userProjects.map((p) => p._id) };
    }

    if (req.query.project)  filter.project  = req.query.project;
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignee) filter.assignee = req.query.assignee;
    if (req.query.overdue === 'true') filter.dueDate = { $lt: new Date() };

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks
router.post(
  '/',
  [
    body('title').trim().isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),
    body('project').notEmpty().withMessage('Project ID is required'),
    body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  ],
  validate,
  async (req, res) => {
    try {
      // Verify user is a member of the project
      const project = await Project.findById(req.body.project);
      if (!project) return res.status(404).json({ message: 'Project not found' });

      const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
      if (!isMember && req.user.role !== 'admin')
        return res.status(403).json({ message: 'Not a member of this project' });

      const task = await Task.create({ ...req.body, createdBy: req.user._id });
      await task.populate('assignee', 'name email avatar');
      await task.populate('createdBy', 'name email avatar');
      await task.populate('project', 'name');
      res.status(201).json({ task });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name')
      .populate('comments.user', 'name email avatar');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id
router.patch(
  '/:id',
  [
    body('title').optional().trim().isLength({ min: 2 }).withMessage('Title too short'),
    body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  ],
  validate,
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ message: 'Task not found' });

      // Only assignee, creator, project admin, or global admin can update
      const project = await Project.findById(task.project);
      const member = project.members.find((m) => m.user.toString() === req.user._id.toString());
      const canEdit =
        task.createdBy.toString() === req.user._id.toString() ||
        task.assignee?.toString() === req.user._id.toString() ||
        member?.role === 'admin' ||
        req.user.role === 'admin';

      if (!canEdit) return res.status(403).json({ message: 'Not authorized to edit this task' });

      const allowed = ['title', 'description', 'status', 'priority', 'assignee', 'dueDate', 'tags'];
      allowed.forEach((f) => { if (req.body[f] !== undefined) task[f] = req.body[f]; });
      await task.save();

      await task.populate('assignee', 'name email avatar');
      await task.populate('createdBy', 'name email avatar');
      await task.populate('project', 'name');
      res.json({ task });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    const member = project.members.find((m) => m.user.toString() === req.user._id.toString());
    const canDelete =
      task.createdBy.toString() === req.user._id.toString() ||
      member?.role === 'admin' ||
      req.user.role === 'admin';

    if (!canDelete) return res.status(403).json({ message: 'Not authorized to delete this task' });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks/:id/comments
router.post(
  '/:id/comments',
  [body('text').trim().notEmpty().withMessage('Comment text is required')],
  validate,
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ message: 'Task not found' });

      task.comments.push({ user: req.user._id, text: req.body.text });
      await task.save();
      await task.populate('comments.user', 'name email avatar');
      res.status(201).json({ comments: task.comments });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// DELETE /api/tasks/:id/comments/:commentId
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const comment = task.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized to delete this comment' });

    comment.deleteOne();
    await task.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;