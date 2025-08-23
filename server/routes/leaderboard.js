const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const User = require('../models/User');
const Test = require('../models/Test');
const TestResult = require('../models/TestResult');

// @desc    Get leaderboard/results for a test (or all students if no test)
// @route   GET /api/tests/leaderboard
// @access  Private
// Query: ?testId=...&page=1&pageSize=15
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { testId, page = 1, pageSize = 15 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    let leaderboard = [];
    let total = 0;
    let mainUser = null;

    if (testId) {
      // Leaderboard for a specific test (students with results, sorted by score desc)
      const results = await TestResult.find({ test: testId })
        .populate('student', 'name rollNo college branch profilePic')
        .populate('test', 'title')
        .sort({ score: -1, timeTaken: 1 })
        .lean();
      total = results.length;
      leaderboard = results.slice(skip, skip + parseInt(pageSize)).map(r => ({
        userId: r.student._id,
        name: r.student.name,
        rollNo: r.student.rollNo,
        college: r.student.college,
        branch: r.student.branch,
        profilePic: r.student.profilePic,
        testName: r.test?.title || '',
        result: r.score + ' / ' + r.totalScore + ' (' + r.percentage + '%)',
        timeSpent: r.timeTaken,
      }));
      // Find main user result (if present)
      const mainResult = results.find(r => r.student._id.toString() === req.user._id.toString());
      if (mainResult) {
        mainUser = {
          userId: mainResult.student._id,
          name: mainResult.student.name,
          rollNo: mainResult.student.rollNo,
          college: mainResult.student.college,
          branch: mainResult.student.branch,
          profilePic: mainResult.student.profilePic,
          testName: mainResult.test?.title || '',
          result: mainResult.score + ' / ' + mainResult.totalScore + ' (' + mainResult.percentage + '%)',
          timeSpent: mainResult.timeTaken,
        };
      }
    } else {
      // No test selected or no results: show all students alphabetically
      const users = await User.find({ role: 'student' })
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(pageSize))
        .lean();
      total = await User.countDocuments({ role: 'student' });
      leaderboard = users.map(u => ({
        userId: u._id,
        name: u.name,
        rollNo: u.rollNo,
        college: u.college,
        branch: u.branch,
        profilePic: u.profilePic,
        testName: '',
        result: '',
        timeSpent: 0,
      }));
      // Main user highlight
      if (req.user.role === 'student') {
        mainUser = {
          userId: req.user._id,
          name: req.user.name,
          rollNo: req.user.rollNo,
          college: req.user.college,
          branch: req.user.branch,
          profilePic: req.user.profilePic,
          testName: '',
          result: '',
          timeSpent: 0,
        };
      }
    }

    res.json({
      success: true,
      total,
      leaderboard,
      mainUser,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard', error: error.message });
  }
});

module.exports = router;
