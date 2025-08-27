const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const testRoutes = require('./routes/tests');
const logoutRoutes = require('./routes/logout');

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Atlas Connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', logoutRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/tests', require('./routes/leaderboard'));
app.use('/api/users', require('./routes/users'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/meta', require('./routes/meta'));
app.use('/api/feedback', require('./routes/feedback'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Max Solutions API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});


// Create default admin if none exists
const User = require('./models/User');
const Test = require('./models/Test');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'admin', email: 'komalp@gmail.com' });
    if (!adminExists) {
      const email = 'komalp@gmail.com';
      const password = 'loveukomal69696';
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = new User({
        name: 'Default Admin',
        email,
        rollNo: 'ADMIN001',
        password: hashedPassword,
        passwordHint: 'Contact developer for admin password',
        college: 'Ace Engineering College',
        year: '',
        branch: '',
        role: 'admin',
        isActive: true
      });
      await admin.save();
      console.log('🔑 Default admin created:');
      console.log('   Email:', email);
      console.log('   Password:', password);
    }
  } catch (err) {
    console.error('❌ Error creating default admin:', err.message);
  }
}


// Backfill testCode for existing tests (bulk update to avoid validation error)
async function backfillTestCodes() {
  try {
    const tests = await Test.find({ $or: [ { testCode: { $exists: false } }, { testCode: null }, { testCode: '' } ] });
    let count = 0;
    for (const test of tests) {
      const code = crypto.randomBytes(4).toString('hex');
      await Test.updateOne({ _id: test._id }, { $set: { testCode: code } });
      count++;
      console.log(`Backfilled testCode for test: ${test.title} (${test._id})`);
    }
    if (count > 0) {
      console.log(`✅ Backfilled testCode for ${count} test(s)`);
    }
  } catch (err) {
    console.error('❌ Error backfilling test codes:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Max Solutions Server running on port ${PORT}`);
  console.log(`📱 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  await createDefaultAdmin();
  await backfillTestCodes();
});
