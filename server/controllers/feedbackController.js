const Feedback = require('../models/Feedback');

// POST /api/feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Feedback message is required.' });
    }
    const user = req.user;
    const feedback = new Feedback({
      user: user._id,
      name: user.name,
      email: user.email,
      message
    });
    await feedback.save();
    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
  }
};

// GET /api/feedback (admin only)
exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json({ success: true, feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch feedback.' });
  }
};
