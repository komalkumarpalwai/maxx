const { Configuration, OpenAIApi } = require('openai');
const Test = require('../models/Test');
const { logAction } = require('./auditLogController');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// AI question generation handler
const generateAIQuestions = async (req, res) => {
  try {
    const { testId, topic, numQuestions } = req.body;
    if (!testId || !topic || !numQuestions) {
      return res.status(400).json({ success: false, message: 'testId, topic, and numQuestions are required' });
    }
    // Prompt for OpenAI
    const prompt = `Generate ${numQuestions} multiple-choice questions on the topic: ${topic}. Format: JSON array of objects with fields: question, options (array of 4), correctAnswer (0-3), points (default 1).`;
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500
    });
    let questions;
    try {
      questions = JSON.parse(completion.data.choices[0].message.content);
    } catch (e) {
      return res.status(500).json({ success: false, message: 'AI response could not be parsed as JSON.' });
    }
    // Validate questions
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No questions generated.' });
    }
    // Update test
    const test = await Test.findByIdAndUpdate(
      testId,
      { $push: { questions: { $each: questions } }, $inc: { totalQuestions: questions.length } },
      { new: true, runValidators: true }
    );
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    await logAction('generate_ai_questions', req.user._id, { testId, topic, count: questions.length });
    res.json({ success: true, message: 'AI questions generated and added', test });
  } catch (error) {
    console.error('AI question generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate AI questions', error: error.message });
  }
};

module.exports = {
  generateAIQuestions
};
