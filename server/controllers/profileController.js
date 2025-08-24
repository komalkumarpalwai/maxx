const User = require('../models/User');
const validator = require('validator');
const { logAction } = require('./auditLogController');

// @desc    Get user profile
// @route   GET /api/profile/:id
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: user.toProfileJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching profile',
      error: error.message 
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, year, branch, college } = req.body;
    
    // Check if user has reached update limit
    if (req.user.profileUpdateCount >= 2) {
      return res.status(400).json({ 
        message: 'Profile update limit reached. You can only update your profile 2 times.',
        error: 'UPDATE_LIMIT_REACHED'
      });
    }
    
    // Only allow updating certain fields
    const updateFields = {};
    if (name) updateFields.name = name;
    if (year) updateFields.year = year;
    if (branch) updateFields.branch = branch;
    if (college) updateFields.college = college;

    // Increment the update count
    updateFields.profileUpdateCount = req.user.profileUpdateCount + 1;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: user.toProfileJSON(),
      remainingUpdates: 2 - user.profileUpdateCount
    });
    // Audit log
  await logAction('update_profile', req.user._id, { updatedFields: updateFields });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Server error while updating profile',
      error: error.message 
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/profile/upload-pic
// @access  Private
const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Fetch user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profilePic = `/uploads/${req.file.filename}`;
    user.profilePic = profilePic;
    await user.save();

    res.json({
      message: 'Profile picture uploaded successfully',
      user: user.toProfileJSON()
    });
  } catch (error) {
    console.error('Upload profile pic error:', error);
    res.status(500).json({ 
      message: 'Server error while uploading profile picture',
      error: error.message 
    });
  }
};

// @desc    Get all users (for admin/faculty)
// @route   GET /api/profile/users
// @access  Private (Admin/Faculty)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.json({ 
      count: users.length,
      users: users.map(user => user.toProfileJSON())
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching users',
      error: error.message 
    });
  }
};

// @desc    Delete user (for admin)
// @route   DELETE /api/profile/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

  await User.findByIdAndDelete(req.params.id);

  res.json({ message: 'User deleted successfully' });
  // Audit log
  await logAction('delete_user', req.user._id, { deletedUserId: req.params.id });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      message: 'Server error while deleting user',
      error: error.message 
    });
  }
};

// @desc    Create user (admin only)
// @route   POST /api/profile/users
// @access  Private (Admin)
const createUser = async (req, res) => {
  try {
  const { name, email, rollNo, branch, isActive, password, role } = req.body;
    if (!name || !email || !rollNo) {
      return res.status(400).json({ message: 'Name, email, and roll number are required' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!validator.isLength(name, { min: 2, max: 50 })) {
      return res.status(400).json({ message: 'Name must be 2-50 characters' });
    }
    if (!validator.isAlphanumeric(rollNo)) {
      return res.status(400).json({ message: 'Roll number must be alphanumeric' });
    }
    // Default password if not provided
    const userPassword = password || 'Welcome@123';
    // Password strength: min 8 chars, upper, lower, number, special
    if (!validator.isStrongPassword(userPassword, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' });
    }
    const user = new User({
      name,
      email,
      rollNo,
      branch,
      isActive: isActive !== undefined ? isActive : true,
      password: userPassword,
      role: role || 'student'
    });
  await user.save();
  res.status(201).json({ message: 'User created successfully', user: user.toProfileJSON() });
  // Audit log
  await logAction('create_user', req.user._id, { createdUserId: user._id });
  } catch (error) {
    console.error('Create user error:', error);
    // Friendly error for invalid branch
    if (error.name === 'ValidationError' && error.errors && error.errors.branch) {
      return res.status(400).json({ message: 'Invalid branch selected. Please choose a valid branch.' });
    }
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/profile/:id
// @access  Private (Admin)
const adminUpdateUser = async (req, res) => {
  try {
    const { name, email, rollNo, branch, isActive } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (rollNo) updateFields.rollNo = rollNo;
    if (branch) updateFields.branch = branch;
    if (isActive !== undefined) updateFields.isActive = isActive;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  res.json({ message: 'User updated successfully', user: user.toProfileJSON() });
  // Audit log
  await logAction('admin_update_user', req.user._id, { updatedUserId: req.params.id, updatedFields: updateFields });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/profile/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  res.json({ message: 'User status updated', user: user.toProfileJSON() });
  // Audit log
  await logAction('update_user_status', req.user._id, { updatedUserId: req.params.id, isActive });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
};

// @desc    Reset user password (admin only)
// @route   PUT /api/profile/:id/reset-password
// @access  Private (Admin)
const resetUserPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required' });
    if (!validator.isStrongPassword(password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = password;
    await user.save();
  res.json({ message: 'Password reset successfully' });
  // Audit log
  await logAction('reset_user_password', req.user._id, { resetUserId: req.params.id });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  uploadProfilePic,
  getAllUsers,
  deleteUser,
  createUser,
  adminUpdateUser,
  updateUserStatus,
  resetUserPassword
};
