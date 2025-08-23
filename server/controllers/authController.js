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

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Prevent admin login via this route
    if (email === 'komalp@gmail.com') {
      return res.status(400).json({
        message: 'Invalid credentials',
        hint: 'Use the admin login form for admin credentials.'
      });
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
    // Generate token
    const token = generateToken(user._id);
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

// @desc    Admin login (hardcoded, no DB)
// @route   POST /api/auth/admin-login
// @access  Public
const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const ADMIN_EMAIL = 'komalp@gmail.com';
  const ADMIN_PASSWORD = 'loveukomal69696';
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Generate a fake token (not tied to DB)
    const token = jwt.sign({ userId: 'admin', role: 'admin' }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    return res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: 'admin',
        name: 'Default Admin',
        email: ADMIN_EMAIL,
        rollNo: 'ADMIN001',
        college: 'Ace Engineering College',
        year: '',
        branch: '',
        profilePic: '/default-avatar.png',
        role: 'admin',
        isActive: true,
        profileUpdateCount: 0,
        passwordHint: 'Contact developer for admin password',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } else {
    return res.status(400).json({ message: 'Invalid admin credentials' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  adminLogin
};
