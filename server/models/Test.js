const mongoose = require('mongoose');
const crypto = require('crypto');

const testSchema = new mongoose.Schema({
  testCode: {
    type: String,
    unique: true,
    required: true,
    immutable: true,
    default: () => crypto.randomBytes(4).toString('hex') // 8-char hex code
  },
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Test category is required'],
    enum: ['Communication', 'Quantitative', 'Technical', 'Interview']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  duration: {
    type: Number, // minutes
  min: [1, 'Duration must be at least 1 minute'],
    max: [180, 'Duration cannot exceed 3 hours']
  },
  totalQuestions: {
    type: Number,
    min: [1, 'Must have at least 1 question']
  },
  passingScore: {
    type: Number,
    min: [0, 'Passing score cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: false
  },
  startDate: Date,
  endDate: Date,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  questions: [{
    question: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['single', 'multi'],
      default: 'single',
      description: 'single = only one answer allowed, multi = multiple answers allowed'
    },
    options: [{
      type: String,
      trim: true
    }],
    correctAnswer: {
      type: Number,
      required: true
    },
    points: {
      type: Number,
      default: 1
    }
  }],

  requireAllQuestions: {
    type: Boolean,
    default: true,
    description: 'If true, student must answer all questions to submit.'
  },
  allowNavigation: {
    type: Boolean,
    default: true,
    description: 'If false, student cannot navigate between questions.'
  },
  tabSwitchLimit: {
    type: Number,
    default: 3,
    min: 1,
    description: 'Allowed tab switches before auto-submit.'
  },
  deviceRestriction: {
    type: String,
    enum: ['mobile', 'desktop', 'both'],
    default: 'both',
    description: 'Device restriction for test.'
  },
  allowedBranches: {
    type: [String],
    default: [],
    description: 'Branches allowed to take this test.'
  },
  allowedYears: {
    type: [String],
    default: [],
    description: 'Years allowed to take this test.'
  }
}, { timestamps: true });

// ✅ Validate dates
testSchema.pre('save', function (next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  if (!this.testCode) {
    this.testCode = crypto.randomBytes(4).toString('hex');
  }
  next();
});

// ✅ Check if test is currently active
testSchema.methods.isCurrentlyActive = function () {
  const now = new Date();
  if (this.isActive === false) return false; // manual override
  if (!this.startDate || !this.endDate) return false;
  return now >= this.startDate && now <= this.endDate;
};

// ✅ Get test status
testSchema.methods.getStatus = function () {
  const now = new Date();
  if (this.isActive === false) return 'inactive';
  if (!this.startDate || !this.endDate) return 'draft';
  if (now < this.startDate) return 'upcoming';
  if (now > this.endDate) return 'expired';
  return 'active';
};

module.exports = mongoose.model('Test', testSchema);


