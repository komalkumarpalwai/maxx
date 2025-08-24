
const express = require('express');
const router = express.Router();
const { auth, isAdmin, isSuperAdmin } = require('../middlewares/auth');
const { changePassword } = require('../controllers/authController');

// @desc    Change password (authenticated)
// @route   POST /api/users/change-password
// @access  Private (Admin/SuperAdmin/User)
router.post('/change-password', auth, changePassword);
const User = require('../models/User');

// @desc    Update admin (superadmin only)
// @route   PUT /api/users/admin/:id
// @access  Private (SuperAdmin)
router.put('/admin/:id', auth, isSuperAdmin, async (req, res) => {
  try {
    const { name, email, rollNo, branch, isActive } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, rollNo, branch, isActive },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.json({ success: true, message: 'Admin updated', admin: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update admin', error: error.message });
  }
});

// @desc    Delete admin (superadmin only)
// @route   DELETE /api/users/admin/:id
// @access  Private (SuperAdmin)
router.delete('/admin/:id', auth, isSuperAdmin, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.json({ success: true, message: 'Admin deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete admin', error: error.message });
  }
});

// @desc    Get all users (admin or superadmin)
// @route   GET /api/users
// @access  Private (Admin or SuperAdmin)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// @desc    Get all admins (admin or superadmin)
// @route   GET /api/users/admins
// @access  Private (Admin or SuperAdmin)
router.get('/admins', auth, isAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json({ success: true, count: admins.length, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admins' });
  }
});

// @desc    Create new admin (admin or superadmin)
// @route   POST /api/users/admin
// @access  Private (Admin or SuperAdmin)
router.post('/admin', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, rollNo, branch } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    const newAdmin = new User({ name, email, rollNo, branch, role: 'admin', isActive: true });
    await newAdmin.save();
    res.status(201).json({ success: true, message: 'Admin created successfully', admin: newAdmin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create admin', error: error.message });
  }
});

module.exports = router;
