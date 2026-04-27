// middleware/upload.js
// ── Multer configs ──
// Exposes a default uploader (broader filetypes, 10 MB) and a dedicated
// avatar uploader (image-only, 5 MB, separate subfolder).

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

// ── Default storage (generic uploads) ──
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ok = /\.(jpg|jpeg|png|webp|pdf)$/i.test(file.originalname);
    if (!ok) return cb(new Error('Only jpg/png/webp/pdf files allowed'));
    cb(null, true);
  },
});

// ── Avatar storage (images only) ──
const AVATAR_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uid = req.user && req.user._id ? String(req.user._id) : 'anon';
    cb(null, `avatar_${uid}_${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const mimeOk = AVATAR_MIME.has(file.mimetype);
    const extOk = /\.(jpg|jpeg|png|webp)$/i.test(file.originalname);
    if (!mimeOk || !extOk) return cb(new Error('Only jpg/png/webp images allowed'));
    cb(null, true);
  },
});

module.exports = upload;
module.exports.uploadAvatar = uploadAvatar;
module.exports.AVATAR_DIR = AVATAR_DIR;
module.exports.UPLOAD_DIR = UPLOAD_DIR;