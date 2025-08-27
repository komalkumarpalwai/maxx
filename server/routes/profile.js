const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth, isAdmin, isSuperAdmin, isFaculty } = require('../middlewares/auth');
const {
  getUserProfile,
  updateProfile,
  uploadProfilePic,
  getAllUsers,
  deleteUser,
  createUser,
  adminUpdateUser,
  updateUserStatus,
  resetUserPassword,
  updatePreferences
} = require('../controllers/profileController');
// Update user preferences (theme, font size)
router.put('/preferences', auth, updatePreferences);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Admin/Faculty routes (define /users before /:id to avoid conflict)
router.get('/users', auth, isFaculty, getAllUsers);
// Only superadmin can create admin users
router.post('/users', auth, isSuperAdmin, createUser);

// Only superadmin can update/delete/reset admin users, others as before
router.put('/:id', auth, (req, res, next) => {
  if (req.body.role === 'admin' || req.body.role === 'superadmin') {
    return isSuperAdmin(req, res, next);
  }
  return isAdmin(req, res, next);
}, adminUpdateUser);
router.put('/:id/status', auth, (req, res, next) => {
  if (req.body.role === 'admin' || req.body.role === 'superadmin') {
    return isSuperAdmin(req, res, next);
  }
  return isAdmin(req, res, next);
}, updateUserStatus);
router.put('/:id/reset-password', auth, (req, res, next) => {
  if (req.body.role === 'admin' || req.body.role === 'superadmin') {
    return isSuperAdmin(req, res, next);
  }
  return isAdmin(req, res, next);
}, resetUserPassword);

// Profile routes (protected)
router.get('/:id', auth, getUserProfile);
router.put('/', auth, updateProfile);
router.post('/upload-pic', auth, upload.single('profilePic'), uploadProfilePic);
router.delete('/:id', auth, (req, res, next) => {
  if (req.body.role === 'admin' || req.body.role === 'superadmin') {
    return isSuperAdmin(req, res, next);
  }
  return isAdmin(req, res, next);
}, deleteUser);

module.exports = router;








