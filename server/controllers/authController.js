const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, rollNo, email, password, year, branch, college, passwordHint } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { rollNo }] 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ 
          message: 'Email already registered',
          hint: 'Try logging in instead, or use a different email address'
        });
      }
      if (existingUser.rollNo === rollNo) {
        return res.status(400).json({ 
          message: 'Roll number already registered',
          hint: 'Roll numbers must be unique. Contact admin if this is an error.'
        });
      }
    }

    // Create new user
    const user = new User({
      name,
      rollNo,
      email,
      password,
      year,
      branch,
      college: college || "Ace Engineering College",
      passwordHint: passwordHint || ''
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toProfileJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle password validation errors specifically
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors,
        hint: 'Please check your input and ensure password meets requirements'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
    });
  }
};


// @desc    Login user (all roles)
// @route   POST /api/auth/login
// @access  Public
const { verifyRecaptcha } = require('../utils/recaptcha');
const login = async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;
    // Only require reCAPTCHA if not running on localhost
    const isLocalhost = req.headers.host && (req.headers.host.startsWith('localhost') || req.headers.host.startsWith('127.0.0.1'));
    if (!isLocalhost) {
      if (!recaptchaToken) {
        return res.status(400).json({ message: 'reCAPTCHA verification failed. Please try again.' });
      }
      const recaptchaOk = await verifyRecaptcha(recaptchaToken);
      if (!recaptchaOk) {
        return res.status(400).json({ message: 'reCAPTCHA failed. Please try again.' });
      }
    }
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid credentials',
        hint: 'Email not found. Check your email address or register if you don\'t have an account.'
      });
    }
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Invalid credentials',
        hint: user.passwordHint || 'Password is incorrect. Remember: passwords are case-sensitive and must contain uppercase, lowercase, number, and special character.'
      });
    }
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account is deactivated',
        hint: 'Contact administrator to reactivate your account.'
      });
    }
    // Generate token with role
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    res.json({
      message: 'Login successful',
      token,
      user: user.toProfileJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: error.message 
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    // If hardcoded admin or superadmin, return as is
    if (!req.user.toProfileJSON) {
      return res.json({ user: req.user });
    }
    res.json({
      user: req.user.toProfileJSON()
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching user data',
      error: error.message 
    });
  }
};


// @desc    Admin login (same as user login, but checks role)
// @route   POST /api/auth/admin-login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not an admin or superadmin account' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    res.json({
      message: 'Admin login successful',
      token,
      user: user.toProfileJSON()
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login', error: error.message });
  }
};


// @desc    Change password (authenticated)
// @route   POST /api/auth/change-password
// @access  Private
const { sendEmail } = require('../utils/email');
const changePassword = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old and new password are required.' });
    }
    // For hardcoded admin/superadmin, block password change
    if (userId === 'admin' || userId === 'superadmin') {
      return res.status(400).json({ message: 'Password change not supported for hardcoded admin/superadmin.' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    // Send email notification
    try {
      await sendEmail({
        to: user.email,
        subject: 'Your password was changed',
        text: `Hello ${user.name},\n\nYour password was successfully changed. If you did not perform this action, please contact support immediately.`,
        html: `<p>Hello ${user.name},</p><p>Your password was <b>successfully changed</b>. If you did not perform this action, please contact support immediately.</p>`
      });
    } catch (emailErr) {
      console.error('Failed to send password change email:', emailErr);
    }
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  adminLogin,
  changePassword
};
