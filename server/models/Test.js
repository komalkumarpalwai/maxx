const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
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
    type: Number, // in minutes
    min: [5, 'Duration must be at least 5 minutes'],
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
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
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
  }]
}, {
  timestamps: true
});

// Validate that end date is after start date, if both are set
testSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});


// Method to check if test is currently active (automatic by time, unless manually deactivated)
testSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  if (this.isActive === false) return false; // manual override
  if (!this.startDate || !this.endDate) return false;
  return now >= this.startDate && now <= this.endDate;
};

// Method to get test status (automatic by time, unless manually deactivated)
testSchema.methods.getStatus = function() {
  const now = new Date();
  if (this.isActive === false) return 'inactive';
  if (!this.startDate || !this.endDate) return 'draft';
  if (now < this.startDate) return 'upcoming';
  if (now > this.endDate) return 'expired';
  return 'active';
};

module.exports = mongoose.model('Test', testSchema);

