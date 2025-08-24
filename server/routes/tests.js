const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const Test = require('../models/Test');
const TestResult = require('../models/TestResult');
const { getTestAnalytics } = require('../controllers/analyticsController');

// @desc    Get all tests (public - for students to see available tests)
// @route   GET /api/tests
// @access  Public
router.get('/', async (req, res) => {
  try {
    let tests;
    if (req.query.all === '1') {
      tests = await Test.find({})
        .select('-questions')
        .populate('createdBy', 'name')
        .sort({ startDate: 1 });
    } else {
      // Show all tests that are isActive: true (regardless of date)
      tests = await Test.find({ isActive: true })
        .select('-questions')
        .populate('createdBy', 'name')
        .sort({ startDate: 1 });
      // Debug log
      console.log('isActive tests:', tests.map(t => t.title));
    }

    res.json({
      success: true,
      count: tests.length,
      tests: tests.map(test => ({
        ...test.toObject(),
        status: test.getStatus()
      }))
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch tests' 
    });
  }
});

// @desc    Get test by ID (for students to take test)
// @route   GET /api/tests/:id
// @access  Private
const mongoose = require('mongoose');
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    const test = await Test.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    if (!test.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'Test is not active' 
      });
    }



    // Remove correct answers for students
    const testForStudent = {
      ...test.toObject(),
      questions: test.questions.map(q => ({
        question: q.question,
        options: q.options,
        points: q.points
      }))
    };

    res.json({
      success: true,
      test: testForStudent
    });
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch test' 
    });
  }
});

// @desc    Create new test (admin only)
// @route   POST /api/tests
// @access  Private (Admin)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    let createdBy = req.user._id;
    // If hardcoded admin, find real admin user
    if (createdBy === 'admin') {
      const realAdmin = await require('../models/User').findOne({ role: 'admin', email: 'komalp@gmail.com' });
      if (realAdmin) createdBy = realAdmin._id;
    }
    const { title, category, description } = req.body;
    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required' });
    }
    const test = new Test({ title, category, description, createdBy });
    await test.save();
    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      test
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create test',
      error: error.message 
    });
  }
});

// @desc    Add questions to a test (admin only)
// @route   PUT /api/tests/:id/questions
// @access  Private (Admin)
router.put('/:id/questions', auth, isAdmin, async (req, res) => {
  try {
    const { questions } = req.body;
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Questions are required' });
    }
    const totalQuestions = questions.length;
    const duration = 30; // default duration
    const passingScore = 40; // default passing score
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { questions, totalQuestions, duration, passingScore },
      { new: true, runValidators: true }
    );
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.json({ success: true, message: 'Questions added', test });
  } catch (error) {
    console.error('Add questions error:', error);
    res.status(500).json({ success: false, message: 'Failed to add questions', error: error.message });
  }
});

// @desc    Activate a test (admin only)
// @route   PUT /api/tests/:id/activate
// @access  Private (Admin)
router.put('/:id/activate', auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start and end date required' });
    }
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { isActive: true, startDate, endDate },
      { new: true, runValidators: true }
    );
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.json({ success: true, message: 'Test activated', test });
  } catch (error) {
    console.error('Activate test error:', error);
    res.status(500).json({ success: false, message: 'Failed to activate test', error: error.message });
  }
});

// @desc    Deactivate a test (admin only)
// @route   PUT /api/tests/:id/deactivate
// @access  Private (Admin)
router.put('/:id/deactivate', auth, isAdmin, async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.json({ success: true, message: 'Test deactivated', test });
  } catch (error) {
    console.error('Deactivate test error:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate test', error: error.message });
  }
});

// @desc    Update test (admin only)
// @route   PUT /api/tests/:id
// @access  Private (Admin)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    res.json({
      success: true,
      message: 'Test updated successfully',
      test
    });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update test',
      error: error.message 
    });
  }
});

// @desc    Delete test (admin only)
// @route   DELETE /api/tests/:id
// @access  Private (Admin)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);

    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }

    // Also delete all results for this test
    await TestResult.deleteMany({ test: req.params.id });

    res.json({
      success: true,
      message: 'Test and related results deleted successfully'
    });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete test' 
    });
  }
});

// @desc    Submit test result
// @route   POST /api/tests/:id/submit
// @access  Private
router.post('/:id/submit', auth, async (req, res) => {
  try {
    // Prevent admin user from submitting tests
    if (req.user._id === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin user cannot submit tests.'
      });
    }
    // Enforce one attempt per user per test
    const existing = await TestResult.findOne({ student: req.user._id, test: req.params.id });
    if (existing) {
      return res.status(403).json({
        success: false,
        message: 'You have already attempted this test.'
      });
    }
    const { answers, timeTaken } = req.body;
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }
    // Calculate score
    let score = 0;
    const processedAnswers = answers.map((answer, index) => {
      const question = test.questions[index];
      const isCorrect = answer.selectedAnswer === question.correctAnswer;
      const points = isCorrect ? question.points : 0;
      score += points;
      return {
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        points
      };
    });
    const totalScore = test.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((score / totalScore) * 100);
    const passed = percentage >= test.passingScore;
    const testResult = new TestResult({
      student: req.user._id,
      test: test._id,
      studentName: req.user.name,
      studentRollNo: req.user.rollNo,
      testTitle: test.title,
      testCategory: test.category,
      score,
      totalScore,
      percentage,
      passed,
      timeTaken,
      answers: processedAnswers,
      startedAt: new Date(),
      completedAt: new Date(),
      status: 'completed'
    });
    await testResult.save();
    res.json({
      success: true,
      message: 'Test submitted successfully',
      result: {
        score,
        totalScore,
        percentage,
        passed,
        timeTaken
      }
    });
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit test',
      error: error.message 
    });
  }
});

// @desc    Get test results for a student
// @route   GET /api/tests/results/student
// @access  Private
router.get('/results/student', auth, async (req, res) => {
  try {
    // Prevent querying for hardcoded admin/superadmin
    if (req.user._id === 'admin' || req.user._id === 'superadmin') {
      return res.json({ success: true, count: 0, results: [] });
    }
    const results = await TestResult.find({ student: req.user._id })
      .populate('test', 'title category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Get student results error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch results' 
    });
  }
});

// @desc    Get all test results (admin only)
// @route   GET /api/tests/results/all
// @access  Private (Admin)
router.get('/results/all', auth, isAdmin, async (req, res) => {
  try {
    const results = await TestResult.find()
      .populate('student', 'name rollNo college')
      .populate('test', 'title category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Get all results error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch results' 
    });
  }
});

// Test analytics (admin only)
router.get('/:id/analytics', auth, isAdmin, getTestAnalytics);

module.exports = router;

