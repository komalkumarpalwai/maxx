// Script to create a superadmin user in MongoDB
// Usage: node createSuperadmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb://localhost:27017/maxx'; // Change if your DB URI is different
const User = require('./models/User');

async function createSuperadmin() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  const email = 'superadmin@example.com'; // Change to your desired superadmin email
  const password = 'SuperAdmin@123';      // Change to your desired password
  const name = 'Super Admin';
  const rollNo = 'SUPERADMIN001';

  // Check if superadmin already exists
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Superadmin already exists:', email);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({
    name,
    email,
    rollNo,
    password: hashed,
    role: 'superadmin',
    isActive: true
  });
  await user.save();
  console.log('Superadmin created!');
  console.log('Email:', email);
  console.log('Password:', password);
  process.exit(0);
}

createSuperadmin().catch(err => {
  console.error('Error creating superadmin:', err);
  process.exit(1);
});
