// models/SupportConfig.js
// ── Singleton support configuration document ──

const mongoose = require('mongoose');

const SupportConfigSchema = new mongoose.Schema({
  whatsappNumber:    { type: String, default: '' },
  whatsappMessage:   { type: String, default: 'Hello, I need help with my account' },
  emailContact:      { type: String, default: '' },
  ticketsEnabled:    { type: Boolean, default: true },
  whatsappEnabled:   { type: Boolean, default: false },
  updatedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SupportConfig', SupportConfigSchema);