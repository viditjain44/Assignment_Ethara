const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    console.log('BODY:', req.body);
    const { name, email, password, role } = req.body;

    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role: role || 'member' });
    const token = signToken(user._id);
    console.log('SUCCESS:', user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    console.log('ERROR NAME:', err.name);
    console.log('ERROR MSG:', err.message);
    console.log('ERROR STACK:', err.stack);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password)))
        return res.status(401).json({ message: 'Invalid email or password' });

      user.password = undefined;
      res.json({ token: signToken(user._id), user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json({ user: req.user }));

// PATCH /api/auth/me
router.patch(
  '/me',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name too short'),
    body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  ],
  validate,
  async (req, res) => {
    try {
      const updates = {};
      ['name', 'avatar'].forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
      res.json({ user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PATCH /api/auth/change-password
router.patch(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('+password');
      if (!(await user.comparePassword(req.body.currentPassword)))
        return res.status(401).json({ message: 'Current password is incorrect' });
      user.password = req.body.newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;