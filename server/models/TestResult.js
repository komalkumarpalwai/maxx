const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  // Store user and test info at submission time
  studentName: { type: String },
  studentRollNo: { type: String },
  testTitle: { type: String },
  testCategory: { type: String },
  score: {
    type: Number,
    required: true,
    min: [0, 'Score cannot be negative']
  },
  totalScore: {
    type: Number,
    required: true,
    min: [0, 'Total score cannot be negative']
  },
  percentage: {
    type: Number,
    required: true,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  passed: {
    type: Boolean,
    required: true
  },
  timeTaken: {
    type: Number, // in minutes
    required: true,
    min: [0, 'Time taken cannot be negative']
  },
  answers: [{
    questionIndex: {
      type: Number,
      required: true
    },
    selectedAnswer: {
      type: Number,
      required: false // allow null/undefined if skipping is allowed
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    points: {
      type: Number,
      default: 0
    }
  }],
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'timeout', 'abandoned'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Compound index to ensure one attempt per student per test per week
testResultSchema.index({ 
  student: 1, 
  test: 1, 
  startedAt: 1 
}, { 
  unique: false 
});

// Method to calculate percentage
testResultSchema.methods.calculatePercentage = function() {
  if (this.totalScore === 0) return 0;
  return Math.round((this.score / this.totalScore) * 100);
};

// Method to check if result is recent (within a week)
testResultSchema.methods.isRecent = function() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return this.startedAt >= oneWeekAgo;
};

// Pre-save middleware to calculate percentage and passed status
testResultSchema.pre('save', function(next) {
  if (this.score !== undefined && this.totalScore !== undefined) {
    this.percentage = this.calculatePercentage();
    this.passed = this.percentage >= 60; // Default passing threshold
  }
  next();
});

module.exports = mongoose.model('TestResult', testResultSchema);



