const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  rollNo: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Roll number cannot exceed 20 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function(password) {
        // Must contain at least: 1 uppercase, 1 lowercase, 1 number, 1 special character
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*(),.?":{}|<>)'
    }
  },
  passwordHint: {
    type: String,
    maxlength: [100, 'Password hint cannot exceed 100 characters'],
    default: ''
  },
  college: {
    type: String,
    default: "Ace Engineering College",
    trim: true
  },
  year: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', ''],
    default: ''
  },
  branch: {
    type: String,
    enum: ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Electronics', ''],
    default: ''
  },
  profilePic: {
    type: String,
    default: "/default-avatar.png"
  },
  role: {
    type: String,
    default: "student",
    enum: ['student', 'admin', 'faculty', 'superadmin']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileUpdateCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 2
  },
  tokenVersion: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user profile without password
userSchema.methods.toProfileJSON = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    rollNo: this.rollNo,
    college: this.college,
    year: this.year,
    branch: this.branch,
    profilePic: this.profilePic,
    role: this.role,
    isActive: this.isActive,
    profileUpdateCount: this.profileUpdateCount,
    passwordHint: this.passwordHint,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('User', userSchema);
