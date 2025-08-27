const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, adminLogin } = require('../controllers/authController');
const { auth } = require('../middlewares/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);

// Protected routes
router.get('/me', auth, getCurrentUser);

module.exports = router;




