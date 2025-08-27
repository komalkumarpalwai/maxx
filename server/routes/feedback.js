const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const { submitFeedback, getAllFeedback } = require('../controllers/feedbackController');

// Submit feedback (student/authenticated)
router.post('/', auth, submitFeedback);

// List all feedback (admin)
router.get('/', auth, isAdmin, getAllFeedback);

module.exports = router;
