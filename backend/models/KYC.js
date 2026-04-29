// models/KYC.js
// ── KYC model — leveled sub-schemas ──
// Per Document 4 Section B.1.

const mongoose = require('mongoose');

const Level2Schema = new mongoose.Schema({
  status:          { type: String, enum: ['not_submitted', 'pending', 'approved', 'rejected'], default: 'not_submitted' },
  fullName:        { type: String, trim: true },
  dateOfBirth:     { type: Date },
  country:         { type: String, trim: true },
  idType:          { type: String, enum: ['passport', 'national_id', 'drivers_license'] },
  idNumber:        { type: String, trim: true },
  expiryDate:      { type: Date },
  idFrontPath:     { type: String, trim: true },   // required at submit
  idBackPath:      { type: String, trim: true },   // optional
  selfiePath:      { type: String, trim: true },   // optional
  rejectionReason: { type: String, trim: true },
  submittedAt:     { type: Date },
  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:      { type: Date },
}, { _id: false });

const Level3Schema = new mongoose.Schema({
  status:          { type: String, enum: ['not_submitted', 'pending', 'approved', 'rejected'], default: 'not_submitted' },
  fullName:        { type: String, trim: true },
  addressLine:     { type: String, trim: true },
  city:            { type: String, trim: true },
  postalCode:      { type: String, trim: true },
  country:         { type: String, trim: true },
  documentPath:    { type: String, trim: true },   // required at submit
  rejectionReason: { type: String, trim: true },
  submittedAt:     { type: Date },
  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:      { type: Date },
}, { _id: false });

const KYCSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  level2: { type: Level2Schema, default: () => ({}) },
  level3: { type: Level3Schema, default: () => ({}) },
}, { timestamps: true });

module.exports = mongoose.model('KYC', KYCSchema);