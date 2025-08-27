const express = require('express');
const router = express.Router();

// @desc    Get allowed branches and years (for dropdowns)
// @route   GET /api/meta/registration-options
// @access  Public
router.get('/registration-options', (req, res) => {
  // These should match the enums in User model
  const branches = [
    'Computer Science',
    'Electrical',
    'Mechanical',
    'Civil',
    'Electronics'
  ];
  const years = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year'
  ];
  res.json({ success: true, branches, years });
});

module.exports = router;
