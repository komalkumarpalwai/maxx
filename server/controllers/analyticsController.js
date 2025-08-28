const TestResult = require('../models/TestResult');
const Test = require('../models/Test');
const User = require('../models/User');

// @desc    Get analytics for a test
// @route   GET /api/tests/:id/analytics
// @access  Private (Admin)
const getTestAnalytics = async (req, res) => {
  try {
    const testId = req.params.id;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    
    const results = await TestResult.find({ test: testId }).populate('user', 'name email');
    if (!results.length) return res.json({ success: true, analytics: null, message: 'No attempts yet' });
    
    const scores = results.map(r => r.score);
    const percentages = results.map(r => r.percentage);
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    
    // Calculate score distribution
    const scoreDistribution = {};
    results.forEach(result => {
      const range = getScoreRange(result.percentage);
      scoreDistribution[range] = (scoreDistribution[range] || 0) + 1;
    });
    
    // Get recent attempts (last 10)
    const recentAttempts = results
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 10)
      .map(result => ({
        studentName: result.user?.name || 'Anonymous',
        score: result.percentage,
        submittedAt: result.submittedAt
      }));
    
    // Calculate question analysis if questions exist
    let questionAnalysis = [];
    if (test.questions && test.questions.length > 0) {
      questionAnalysis = test.questions.map((question, index) => {
        const correctAnswers = results.filter(result => {
          const answer = result.answers?.find(a => a.questionIndex === index);
          return answer && answer.selectedAnswer === question.correctAnswer;
        }).length;
        
        return {
          questionIndex: index,
          totalAttempts: results.length,
          correctAnswers,
          accuracy: correctAnswers / results.length
        };
      });
    }
    
    const analytics = {
      testTitle: test.title,
      totalAttempts: results.length,
      averageScore: parseFloat((scores.reduce((a, b) => a + b, 0) / results.length).toFixed(2)),
      averagePercentage: parseFloat((percentages.reduce((a, b) => a + b, 0) / results.length).toFixed(2)),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passRate: parseFloat(((passed / results.length) * 100).toFixed(2)),
      failRate: parseFloat(((failed / results.length) * 100).toFixed(2)),
      successRate: parseFloat(((passed / results.length) * 100).toFixed(2)), // Alias for passRate
      passed,
      failed,
      scoreDistribution,
      recentAttempts,
      questionAnalysis
    };
    
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Get test analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get analytics', error: error.message });
  }
};

// Helper function to categorize scores into ranges
const getScoreRange = (percentage) => {
  if (percentage >= 90) return '90-100%';
  if (percentage >= 80) return '80-89%';
  if (percentage >= 70) return '70-79%';
  if (percentage >= 60) return '60-69%';
  if (percentage >= 50) return '50-59%';
  return 'Below 50%';
};

module.exports = { getTestAnalytics };
