// models/SupportTicket.js
// ── Support ticket ──

const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject:       { type: String, required: true, trim: true, maxlength: 200 },
  status:        { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open', index: true },
  category:      { type: String, enum: ['general', 'deposit', 'withdrawal', 'kyc', 'trading', 'technical', 'other'], default: 'general' },
  assignedTo:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessageAt: { type: Date, default: Date.now, index: true },
  unreadByUser:  { type: Number, default: 0 },
  unreadByAdmin: { type: Number, default: 1 },
  closedAt:      { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);