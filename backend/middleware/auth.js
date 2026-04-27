// middleware/auth.js
// ── JWT access-token verification middleware ──

const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing access token' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (_e) {
      return res.status(401).json({ message: 'Invalid or expired access token' });
    }

    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.isFrozen) return res.status(403).json({ message: user.freezeReason || 'Account is frozen' });

    req.user = user;
    req.userId = user._id;
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = auth;