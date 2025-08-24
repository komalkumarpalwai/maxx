const TestResult = require('../models/TestResult');
const Test = require('../models/Test');

// @desc    Get analytics for a test
// @route   GET /api/tests/:id/analytics
// @access  Private (Admin)
const getTestAnalytics = async (req, res) => {
  try {
    const testId = req.params.id;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    const results = await TestResult.find({ test: testId });
    if (!results.length) return res.json({ success: true, analytics: null, message: 'No attempts yet' });
    const scores = results.map(r => r.score);
    const percentages = results.map(r => r.percentage);
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const analytics = {
      testTitle: test.title,
      totalAttempts: results.length,
      averageScore: (scores.reduce((a, b) => a + b, 0) / results.length).toFixed(2),
      averagePercentage: (percentages.reduce((a, b) => a + b, 0) / results.length).toFixed(2),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passRate: ((passed / results.length) * 100).toFixed(2),
      failRate: ((failed / results.length) * 100).toFixed(2),
      passed,
      failed
    };
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Get test analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get analytics', error: error.message });
  }
};

module.exports = { getTestAnalytics };
