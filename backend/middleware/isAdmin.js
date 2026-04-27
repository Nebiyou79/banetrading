// middleware/isAdmin.js
// ── Admin-only guard (chain after auth) ──

function isAdmin(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = isAdmin;