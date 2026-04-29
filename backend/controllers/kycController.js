// controllers/kycController.js
// ── KYC controller ──

const fs = require('fs');
const path = require('path');

const KYC = require('../models/KYC');
const User = require('../models/User');

// ── Helpers ──
function safeUnlink(absPath) {
  if (!absPath) return;
  fs.unlink(absPath, (err) => {
    if (err && err.code !== 'ENOENT') console.error('[kycController] unlink failed:', absPath, err);
  });
}

function unlinkUploaded(req) {
  const files = req.files || {};
  for (const key of Object.keys(files)) {
    const arr = Array.isArray(files[key]) ? files[key] : [files[key]];
    for (const f of arr) if (f && f.path) safeUnlink(f.path);
  }
  if (req.file && req.file.path) safeUnlink(req.file.path);
}

function relativePath(absPath) {
  if (!absPath) return undefined;
  const uploadsRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
  const rel = path.relative(uploadsRoot, absPath);
  if (rel.startsWith('..')) return absPath; // outside expected root — store as-is
  return `/uploads/${rel.split(path.sep).join('/')}`;
}

async function getOrCreateKyc(userId) {
  let doc = await KYC.findOne({ userId });
  if (!doc) doc = await KYC.create({ userId });
  return doc;
}

// ── GET /api/kyc/status ──
async function getStatus(req, res) {
  try {
    const doc = await getOrCreateKyc(req.user._id);
    return res.status(200).json({
      tier:   req.user.kycTier || 1,
      level2: doc.level2 || {},
      level3: doc.level3 || {},
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/kyc/level2 ── (multipart)
async function submitLevel2(req, res) {
  try {
    const user = req.user;

    // Guard 1 — Level 1 must be reached
    if ((user.kycTier || 0) < 1) {
      unlinkUploaded(req);
      return res.status(403).json({ message: 'Verify your email (Level 1) before submitting Level 2.' });
    }

    const doc = await getOrCreateKyc(user._id);
    const currentStatus = doc.level2?.status || 'not_submitted';

    // Guard 2 — block submit if pending or already approved
    if (currentStatus === 'pending') {
      unlinkUploaded(req);
      return res.status(409).json({ message: 'Level 2 is already pending review.' });
    }
    if (currentStatus === 'approved') {
      unlinkUploaded(req);
      return res.status(409).json({ message: 'Level 2 is already approved.' });
    }

    // Required: idFront file
    const files = req.files || {};
    const idFrontFile = (files.idFront && files.idFront[0]) || null;
    if (!idFrontFile) {
      unlinkUploaded(req);
      return res.status(400).json({ message: 'Front of ID document is required.' });
    }
    const idBackFile = (files.idBack && files.idBack[0]) || null;
    const selfieFile = (files.selfie && files.selfie[0]) || null;

    // Clean up any old files for this level before overwriting
    if (doc.level2?.idFrontPath) safeUnlink(absoluteFromRelative(doc.level2.idFrontPath));
    if (doc.level2?.idBackPath)  safeUnlink(absoluteFromRelative(doc.level2.idBackPath));
    if (doc.level2?.selfiePath)  safeUnlink(absoluteFromRelative(doc.level2.selfiePath));

    const { fullName, dateOfBirth, country, idType, idNumber, expiryDate } = req.body;

    doc.level2 = {
      status:          'pending',
      fullName,
      dateOfBirth,
      country,
      idType,
      idNumber,
      expiryDate:      expiryDate || undefined,
      idFrontPath:     relativePath(idFrontFile.path),
      idBackPath:      idBackFile ? relativePath(idBackFile.path) : undefined,
      selfiePath:      selfieFile ? relativePath(selfieFile.path) : undefined,
      // Reset review fields on (re)submit
      rejectionReason: undefined,
      submittedAt:     new Date(),
      reviewedBy:      undefined,
      reviewedAt:      undefined,
    };
    await doc.save();

    return res.status(200).json({
      message: 'Submitted for review',
      level2:  doc.level2,
    });
  } catch (err) {
    console.error(err);
    unlinkUploaded(req);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/kyc/level3 ── (multipart, single 'document')
async function submitLevel3(req, res) {
  try {
    const user = req.user;

    // Guard 1 — Level 2 must be approved
    if ((user.kycTier || 0) < 2) {
      unlinkUploaded(req);
      return res.status(403).json({ message: 'Complete Level 2 before submitting Level 3.' });
    }

    const doc = await getOrCreateKyc(user._id);
    const currentStatus = doc.level3?.status || 'not_submitted';

    if (currentStatus === 'pending') {
      unlinkUploaded(req);
      return res.status(409).json({ message: 'Level 3 is already pending review.' });
    }
    if (currentStatus === 'approved') {
      unlinkUploaded(req);
      return res.status(409).json({ message: 'Level 3 is already approved.' });
    }

    if (!req.file) {
      unlinkUploaded(req);
      return res.status(400).json({ message: 'Proof of address document is required.' });
    }

    if (doc.level3?.documentPath) safeUnlink(absoluteFromRelative(doc.level3.documentPath));

    const { fullName, addressLine, city, postalCode, country } = req.body;

    doc.level3 = {
      status:          'pending',
      fullName,
      addressLine,
      city,
      postalCode,
      country,
      documentPath:    relativePath(req.file.path),
      rejectionReason: undefined,
      submittedAt:     new Date(),
      reviewedBy:      undefined,
      reviewedAt:      undefined,
    };
    await doc.save();

    return res.status(200).json({
      message: 'Submitted for review',
      level3:  doc.level3,
    });
  } catch (err) {
    console.error(err);
    unlinkUploaded(req);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── Admin: list KYC docs that have something pending ──
async function listPending(req, res) {
  try {
    const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200);
    const skip  = Math.max(Number.parseInt(String(req.query.skip ?? '0'), 10) || 0, 0);

    const filter = { $or: [{ 'level2.status': 'pending' }, { 'level3.status': 'pending' }] };
    const [items, total] = await Promise.all([
      KYC.find(filter)
        .populate('userId', 'email name displayName kycTier')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      KYC.countDocuments(filter),
    ]);
    return res.status(200).json({ items, total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── Admin: approve / reject a level ──
async function adminApprove(req, res) {
  try {
    const { userId } = req.params;
    const level = Number(req.params.level);
    if (level !== 2 && level !== 3) return res.status(400).json({ message: 'Invalid level' });

    const doc = await KYC.findOne({ userId });
    if (!doc) return res.status(404).json({ message: 'KYC submission not found' });

    const key = level === 2 ? 'level2' : 'level3';
    const sub = doc[key];
    if (!sub || sub.status !== 'pending') {
      return res.status(400).json({ message: `Level ${level} is not pending` });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    sub.status          = 'approved';
    sub.reviewedBy      = req.user._id;
    sub.reviewedAt      = new Date();
    sub.rejectionReason = undefined;
    doc[key] = sub;
    await doc.save();

    // Bump user's tier monotonically (never decrease).
    const targetTier = level === 2 ? 2 : 3;
    if ((user.kycTier || 0) < targetTier) {
      user.kycTier = targetTier;
      await user.save();
    }

    return res.status(200).json({
      message: `Level ${level} approved`,
      level:   level,
      [key]:   sub,
      user:    { kycTier: user.kycTier },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function adminReject(req, res) {
  try {
    const { userId } = req.params;
    const level = Number(req.params.level);
    if (level !== 2 && level !== 3) return res.status(400).json({ message: 'Invalid level' });

    const reason = String(req.body?.reason || '').trim();
    if (reason.length < 2) return res.status(400).json({ message: 'Rejection reason is required' });

    const doc = await KYC.findOne({ userId });
    if (!doc) return res.status(404).json({ message: 'KYC submission not found' });

    const key = level === 2 ? 'level2' : 'level3';
    const sub = doc[key];
    if (!sub || sub.status !== 'pending') {
      return res.status(400).json({ message: `Level ${level} is not pending` });
    }

    sub.status          = 'rejected';
    sub.rejectionReason = reason.slice(0, 500);
    sub.reviewedBy      = req.user._id;
    sub.reviewedAt      = new Date();
    doc[key] = sub;
    await doc.save();

    // No tier change on rejection.
    return res.status(200).json({
      message: `Level ${level} rejected`,
      level,
      [key]: sub,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── Internal helper ──
function absoluteFromRelative(relativeUrl) {
  if (!relativeUrl) return null;
  const trimmed = relativeUrl.replace(/^\/+/, '');
  return path.resolve(process.cwd(), trimmed);
}

module.exports = {
  getStatus,
  submitLevel2,
  submitLevel3,
  listPending,
  adminApprove,
  adminReject,
};