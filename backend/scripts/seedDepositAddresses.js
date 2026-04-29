// scripts/seedDepositAddresses.js
// Run: node scripts/seedDepositAddresses.js

require('dotenv').config();
const mongoose = require('mongoose');
const DepositAddresses = require('../models/DepositAddresses');

const TEST_ADDRESSES = {
  'USDT-ERC20': '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
  'USDT-TRC20': 'TJRabcXYZ1234567890abcXYZ1234567890abc',
  'USDT-BEP20': '0xBbBbBb2234567890BbBbBb2234567890BbBbBb22',
  BTC:          'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  ETH:          '0xDeAdBeEf1234567890DeAdBeEf1234567890DeAd',
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Upsert — safe to run multiple times
  const doc = await DepositAddresses.findOneAndUpdate(
    {},
    { $set: { addresses: TEST_ADDRESSES } },
    { upsert: true, new: true },
  );

  console.log('Deposit addresses saved:\n', doc.addresses);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});