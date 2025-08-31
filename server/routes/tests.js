const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const Test = require('../models/Test');
const TestResult = require('../models/TestResult');
// @desc    Update a single question in a test (admin only)
// @route   PUT /api/tests/:id/questions/update
// @access  Private (Admin)
router.put('/:id/questions/update', auth, isAdmin, async (req, res) => {
  try {
  const { index, question, option1, option2, option3, option4, correctAnswer, points, type } = req.body;
    if (index === undefined || index === null || isNaN(Number(index))) {
      return res.status(400).json({ success: false, message: 'Question index is required' });
    }
    if (!question || !option1 || !option2 || !option3 || !option4) {
      return res.status(400).json({ success: false, message: 'All options and question text are required' });
    }
    if (correctAnswer === undefined || correctAnswer === null || correctAnswer === '' || isNaN(Number(correctAnswer))) {
      return res.status(400).json({ success: false, message: 'Correct answer is required' });
    }
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    if (!test.questions || !Array.isArray(test.questions) || test.questions.length <= Number(index)) {
      return res.status(400).json({ success: false, message: 'Invalid question index' });
    }
    // Update the question at the given index
    test.questions[index] = {
      question,
      type: type || 'single',
      options: [option1, option2, option3, option4],
      correctAnswer: Number(correctAnswer) - 1, // frontend uses 1-4, backend uses 0-3
      points: points ? Number(points) : 1
    };
    await test.save();
    res.json({ success: true, message: 'Question updated', question: test.questions[index] });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ success: false, message: 'Failed to update question', error: error.message });
  }
  
});
const { getTestAnalytics } = require('../controllers/analyticsController');
const { upload, uploadQuestionsCSV } = require('../controllers/csvController');

// @desc    Get all questions for a test (admin only)
// @route   GET /api/tests/:id/admin-questions
// @access  Private (Admin)
router.get('/:id/admin-questions', auth, isAdmin, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.json({
      success: true,
      questions: test.questions || [],
      testTitle: test.title
    });
  } catch (error) {
    console.error('Get admin questions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch questions', error: error.message });
  }
});
// @desc    Upload questions via CSV (admin only)
// @route   POST /api/tests/upload-csv
// @access  Private (Admin)
router.post('/upload-csv', auth, isAdmin, upload.single('file'), uploadQuestionsCSV);

// @desc    Generate questions using AI (admin only, coming soon)
// @route   POST /api/tests/generate-ai
// @access  Private (Admin)
router.post('/generate-ai', auth, isAdmin, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'AI question generation will be released for Admin and Faculty soon in future versions.'
  });
});

// @desc    Get all tests (public - for students to see available tests)
// @route   GET /api/tests
// @access  Public
router.get('/', async (req, res) => {
  try {
    let tests;
    if (req.query.all === '1') {
      tests = await Test.find({})
        .select('-questions') // exclude questions, include all other fields (including testCode)
        .populate('createdBy', 'name')
        .sort({ startDate: 1 });
    } else {
      // Show all tests that are isActive: true (regardless of date)
      tests = await Test.find({ isActive: true })
        .select('-questions') // exclude questions, include all other fields (including testCode)
        .populate('createdBy', 'name')
        .sort({ startDate: 1 });
      // Debug log
      console.log('isActive tests:', tests.map(t => t.title));
    }

    res.json({
      success: true,
      count: tests.length,
      tests: tests.map(test => {
        const obj = test.toObject();
        return {
          ...obj,
          status: test.getStatus(),
          passingScore: typeof obj.passingScore === 'number' && !isNaN(obj.passingScore) ? obj.passingScore : 40
        };
      })
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



    // Remove correct answers for students, but include requireAllQuestions, allowNavigation, and passingScore
    const obj = test.toObject();
    const testForStudent = {
      ...obj,
      questions: test.questions.map(q => ({
        question: q.question,
        options: q.options,
        points: q.points
      })),
      requireAllQuestions: test.requireAllQuestions,
      allowNavigation: test.allowNavigation,
      passingScore: typeof obj.passingScore === 'number' && !isNaN(obj.passingScore) ? obj.passingScore : 40
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
    const {
      title,
      category,
      description,
      requireAllQuestions,
      allowNavigation,
      tabSwitchLimit,
      deviceRestriction,
      allowedBranches,
      allowedYears,
      passingScore
    } = req.body;
    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required' });
    }
    // Check for duplicate title (case-insensitive)
    const existingTest = await Test.findOne({ title: { $regex: `^${title}$`, $options: 'i' } });
    if (existingTest) {
      return res.status(400).json({ success: false, message: 'A test with this title already exists. Please choose a different name.' });
    }
    const test = new Test({
      title,
      category,
      description,
      createdBy,
      requireAllQuestions,
      allowNavigation,
      tabSwitchLimit,
      deviceRestriction,
      allowedBranches,
      allowedYears,
      passingScore: typeof passingScore === 'number' && !isNaN(passingScore) ? passingScore : 40
    });
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
    // Validate each question
    for (const [i, q] of questions.entries()) {
      if (!q.question || !q.option1 || !q.option2 || !q.option3 || !q.option4) {
        return res.status(400).json({ success: false, message: `All options are required for question ${i + 1}` });
      }
      if (q.correctAnswer === undefined || q.correctAnswer === null || q.correctAnswer === '' || isNaN(Number(q.correctAnswer))) {
        return res.status(400).json({ success: false, message: `Correct answer is required for question ${i + 1}` });
      }
    }
    // Convert options to array and correctAnswer to number
    const formattedQuestions = questions.map(q => ({
      question: q.question,
      type: q.type || 'single',
      options: [q.option1, q.option2, q.option3, q.option4],
      correctAnswer: Number(q.correctAnswer) - 1, // frontend uses 1-4, backend uses 0-3
      points: q.points ? Number(q.points) : 1
    }));
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    // Append new questions
    test.questions = [...test.questions, ...formattedQuestions];
    test.totalQuestions = test.questions.length;
    // Ensure testCode exists for legacy tests
    if (!test.testCode) {
      const crypto = require('crypto');
      test.testCode = crypto.randomBytes(4).toString('hex');
    }
    await test.save();
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
    const { startDate, endDate, duration } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start and end date required' });
    }
    // Only add duration if it's a valid number
    const updateFields = { isActive: true, startDate, endDate };
    if (typeof duration === 'number' && duration > 0) {
      updateFields.duration = duration;
    }
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.json({ success: true, message: 'Test activated', test });
  } catch (error) {
    console.error('Activate test error:', error);
    if (error.name === 'ValidationError') {
      // Send validation error details to frontend
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', '), error: error.message });
    }
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
    const {
      requireAllQuestions,
      allowNavigation,
      tabSwitchLimit,
      deviceRestriction,
      allowedBranches,
      allowedYears,
      ...otherFields
    } = req.body;
    const updateFields = {
      ...otherFields,
      ...(requireAllQuestions !== undefined ? { requireAllQuestions } : {}),
      ...(allowNavigation !== undefined ? { allowNavigation } : {}),
      ...(tabSwitchLimit !== undefined ? { tabSwitchLimit } : {}),
      ...(deviceRestriction !== undefined ? { deviceRestriction } : {}),
      ...(allowedBranches !== undefined ? { allowedBranches } : {}),
      ...(allowedYears !== undefined ? { allowedYears } : {})
    };
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      updateFields,
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
    if (error.name === 'ValidationError') {
      // Send validation error details to frontend
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', '), error: error.message });
    }
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
    // Debug log: print received answers
    console.log('Test submission received:', {
      user: req.user?._id,
      testId: req.params.id,
      answers: req.body.answers,
      timeTaken: req.body.timeTaken
    });
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
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found' 
      });
    }
    let { answers, timeTaken } = req.body;
    // Convert answers object to array if needed (for forced/violation submits)
    if (answers && !Array.isArray(answers)) {
      answers = test.questions.map((q, idx) => {
        const key = q?._id ? String(q._id) : `q-${idx}`;
        const ans = answers[key];
        return { selectedAnswer: typeof ans === 'number' ? ans : null };
      });
    }

    // Enforce required answers if requireAllQuestions is true and not a forced/violation submit
    if (test.requireAllQuestions && !req.body.forced) {
      if (!answers || answers.length !== test.questions.length || answers.some(a => a.selectedAnswer === undefined || a.selectedAnswer === null)) {
        return res.status(400).json({
          success: false,
          message: 'All questions must be answered for this test.'
        });
      }
    } else {
      // If skipping is allowed, fill missing answers with null selectedAnswer
      if (!answers || answers.length !== test.questions.length) {
        // pad answers array to match questions length
        const filled = Array(test.questions.length).fill({});
        answers = answers || [];
        for (let i = 0; i < answers.length; i++) filled[i] = answers[i];
        answers = filled;
      }
    }

    // Enforce single-choice backend validation
    for (let i = 0; i < test.questions.length; i++) {
      const q = test.questions[i];
      const ans = answers[i];
      if (q.type === 'single') {
        // Accept both array and number for backward compatibility
        if (Array.isArray(ans.selectedAnswer)) {
          if (ans.selectedAnswer.length !== 1) {
            return res.status(400).json({
              success: false,
              message: `Only one answer allowed for question ${i + 1}`
            });
          }
        }
      }
    }

    let score = 0;
    // Allow skipped answers if requireAllQuestions is false
    const processedAnswers = test.questions.map((question, index) => {
      const answer = answers && answers[index] ? answers[index] : {};
      const selectedAnswer = (answer.selectedAnswer !== undefined && answer.selectedAnswer !== null) ? answer.selectedAnswer : null;
      // Ensure both are numbers for comparison
      const isCorrect = selectedAnswer !== null && Number(selectedAnswer) === Number(question.correctAnswer);
      const points = isCorrect ? question.points : 0;
      if (selectedAnswer !== null) score += points;
      return {
        questionIndex: index,
        selectedAnswer,
        isCorrect: selectedAnswer !== null ? isCorrect : false,
        points: selectedAnswer !== null ? points : 0
      };
    });
    const totalScore = test.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
    const passed = typeof test.passingScore === 'number' ? percentage >= test.passingScore : percentage >= 40;
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


