const { parse } = require('csv-parse/sync');
const multer = require('multer');
const fs = require('fs');
const Test = require('../models/Test');
const { logAction } = require('./auditLogController');

// Multer setup for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// CSV upload handler
const uploadQuestionsCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const testId = req.body.testId;
    if (!testId) {
      return res.status(400).json({ success: false, message: 'Test ID is required' });
    }
    // Parse CSV using sync API
    let records;
    try {
      records = parse(req.file.buffer.toString(), { columns: true, trim: true });
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid CSV format', error: err.message });
    }
    // Validate and map questions for the user's format
    const questions = records.map((row, idx) => {
      if (!row.question || !row.option1 || !row.option2 || !row.option3 || !row.option4 || !row.correctAnswer) {
        throw new Error(`Missing fields in row ${idx + 1}`);
      }
      const options = [row.option1, row.option2, row.option3, row.option4];
      return {
        question: row.question,
        options,
        correctAnswer: parseInt(row.correctAnswer, 10) - 1, // CSV is 1-based, model is 0-based
        points: row.points ? parseInt(row.points, 10) : 1
      };
    });
    // Update test
    const test = await Test.findByIdAndUpdate(
      testId,
      { $push: { questions: { $each: questions } }, $inc: { totalQuestions: questions.length } },
      { new: true, runValidators: true }
    );
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    await logAction('upload_questions_csv', req.user._id, { testId, count: questions.length });
    res.json({ success: true, message: 'Questions uploaded', test });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload questions', error: error.message });
  }
};

module.exports = {
  upload,
  uploadQuestionsCSV
};
