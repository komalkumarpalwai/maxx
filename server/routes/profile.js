const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth, isAdmin, isFaculty } = require('../middlewares/auth');
const {
  getUserProfile,
  updateProfile,
  uploadProfilePic,
  getAllUsers,
  deleteUser
} = require('../controllers/profileController');

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

// Profile routes (protected)
router.get('/:id', auth, getUserProfile);
router.put('/', auth, updateProfile);
router.post('/upload-pic', auth, upload.single('profilePic'), uploadProfilePic);
router.delete('/:id', auth, isAdmin, deleteUser);

module.exports = router;
