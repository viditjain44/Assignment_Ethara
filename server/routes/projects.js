const router = require('express').Router();
const { body } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { projectAccess, projectAdminOnly } = require('../middleware/projectAccess');
const validate = require('../middleware/validate');

router.use(protect);

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { 'members.user': req.user._id };
    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    const ids = projects.map((p) => p._id);
    const counts = await Task.aggregate([
      { $match: { project: { $in: ids } } },
      { $group: { _id: '$project', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c]));

    res.json({
      projects: projects.map((p) => ({
        ...p.toObject(),
        taskCount: countMap[p._id.toString()]?.total || 0,
        doneCount: countMap[p._id.toString()]?.done  || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Project name required (min 2 chars)'),
    body('deadline').optional().isISO8601().withMessage('Invalid deadline date'),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, description, deadline } = req.body;
      const project = await Project.create({
        name, description, deadline: deadline || null,
        owner: req.user._id,
        members: [{ user: req.user._id, role: 'admin' }],
      });
      await project.populate('owner', 'name email avatar');
      await project.populate('members.user', 'name email avatar');
      res.status(201).json({ project });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/projects/:projectId
router.get('/:projectId', projectAccess, async (req, res) => {
  await req.project.populate('owner', 'name email avatar');
  await req.project.populate('members.user', 'name email avatar');
  res.json({ project: req.project });
});

// PATCH /api/projects/:projectId
router.patch(
  '/:projectId',
  projectAccess, projectAdminOnly,
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name too short'),
    body('status').optional().isIn(['active', 'completed', 'archived']).withMessage('Invalid status'),
    body('deadline').optional().isISO8601().withMessage('Invalid deadline'),
  ],
  validate,
  async (req, res) => {
    try {
      const updates = {};
      ['name', 'description', 'status', 'deadline'].forEach((f) => {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
      });
      const project = await Project.findByIdAndUpdate(req.params.projectId, updates, { new: true, runValidators: true })
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar');
      res.json({ project });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// DELETE /api/projects/:projectId
router.delete('/:projectId', projectAccess, projectAdminOnly, async (req, res) => {
  try {
    await Task.deleteMany({ project: req.params.projectId });
    await Project.findByIdAndDelete(req.params.projectId);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects/:projectId/members
router.post(
  '/:projectId/members',
  projectAccess, projectAdminOnly,
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('role').optional().isIn(['admin', 'member']).withMessage('Invalid role'),
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) return res.status(404).json({ message: 'No user found with that email' });

      const already = req.project.members.some((m) => m.user.toString() === user._id.toString());
      if (already) return res.status(409).json({ message: 'User is already a member' });

      req.project.members.push({ user: user._id, role: req.body.role || 'member' });
      await req.project.save();
      await req.project.populate('members.user', 'name email avatar');
      res.json({ project: req.project });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PATCH /api/projects/:projectId/members/:userId
router.patch(
  '/:projectId/members/:userId',
  projectAccess, projectAdminOnly,
  [body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member')],
  validate,
  async (req, res) => {
    try {
      const member = req.project.members.find((m) => m.user.toString() === req.params.userId);
      if (!member) return res.status(404).json({ message: 'Member not found' });
      member.role = req.body.role;
      await req.project.save();
      await req.project.populate('members.user', 'name email avatar');
      res.json({ project: req.project });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// DELETE /api/projects/:projectId/members/:userId
router.delete('/:projectId/members/:userId', projectAccess, projectAdminOnly, async (req, res) => {
  try {
    if (req.params.userId === req.project.owner.toString())
      return res.status(400).json({ message: 'Cannot remove the project owner' });

    req.project.members = req.project.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await req.project.save();
    await req.project.populate('members.user', 'name email avatar');
    res.json({ project: req.project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;