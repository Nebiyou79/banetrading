// config/db.js
// ── Mongoose connection helper ──

const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[db] MongoDB connected');
  } catch (err) {
    console.error('[db] Connection failed:', err);
    process.exit(1);
  }
}

module.exports = { connectDB };