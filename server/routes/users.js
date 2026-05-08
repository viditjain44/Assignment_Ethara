const router = require('express').Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

// GET /api/users — admin sees all, member searches by email
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name:  { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    // Non-admins can only search (for adding to projects), not list all users
    if (req.user.role !== 'admin' && !req.query.search)
      return res.status(403).json({ message: 'Provide a search query' });

    const users = await User.find(filter).select('-password').limit(20).sort({ name: 1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/:id/role  — admin only
router.patch('/:id/role', adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role))
      return res.status(400).json({ message: 'Role must be admin or member' });

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id — admin only
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot delete your own account' });

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;