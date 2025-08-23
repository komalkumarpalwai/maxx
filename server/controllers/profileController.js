const User = require('../models/User');

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
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      message: 'Server error while deleting user',
      error: error.message 
    });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  uploadProfilePic,
  getAllUsers,
  deleteUser
};
