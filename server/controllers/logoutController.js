// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const logoutAll = async (req, res) => {
  try {
    // For JWT, to invalidate all tokens, we need to implement a token blacklist or a token version system.
    // Here, we use a tokenVersion field on the user. Incrementing it will invalidate all previous tokens.
    req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
    await req.user.save();
    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to logout from all devices', error: error.message });
  }
};

module.exports = { logoutAll };
