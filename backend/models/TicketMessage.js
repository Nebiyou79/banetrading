// models/TicketMessage.js
// ── Individual message in a ticket thread ──

const mongoose = require('mongoose');

const TicketMessageSchema = new mongoose.Schema({
  ticketId:    { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket', required: true, index: true },
  senderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole:  { type: String, enum: ['user', 'admin'], required: true },
  body:        { type: String, required: true, maxlength: 5000 },
  attachments: { type: [String], default: [] },
  readAt:      { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('TicketMessage', TicketMessageSchema);