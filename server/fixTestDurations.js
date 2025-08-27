// Script to update all tests with missing or invalid duration in MongoDB
// Usage: node fixTestDurations.js

const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/maxx'; // Change if needed

const Test = require('./models/Test');

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // Find tests with missing or invalid duration
  const tests = await Test.find({ $or: [ { duration: { $exists: false } }, { duration: { $lte: 0 } }, { duration: { $type: 'string' } } ] });
  if (tests.length === 0) {
    console.log('All tests have valid durations.');
    process.exit(0);
  }
  console.log(`Found ${tests.length} test(s) with missing/invalid duration.`);

  // Set a default duration (e.g., 30 minutes) or prompt for each test
  const DEFAULT_DURATION = 30;
  for (const test of tests) {
    test.duration = DEFAULT_DURATION;
    await test.save();
    console.log(`Updated test: ${test._id} (${test.title}) to duration ${DEFAULT_DURATION} min.`);
  }
  console.log('Done.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
