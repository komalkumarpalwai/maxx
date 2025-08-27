// Script to backfill testCode for all tests missing it
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const crypto = require('crypto');
const Test = require('./models/Test');
const db = require('./config/db'); // adjust path if needed

async function backfillTestCodes() {
  await db();
  const tests = await Test.find({ $or: [ { testCode: { $exists: false } }, { testCode: null }, { testCode: '' } ] });
  let updated = 0;
  for (const test of tests) {
    if (!test.testCode) {
      test.testCode = crypto.randomBytes(4).toString('hex');
      try {
        await test.save();
        updated++;
        console.log(`Updated test ${test._id} with code ${test.testCode}`);
      } catch (err) {
        console.error(`Failed to update test ${test._id}:`, err.message);
      }
    }
  }
  console.log(`Backfill complete. Updated ${updated} tests.`);
  process.exit(0);
}

backfillTestCodes();
