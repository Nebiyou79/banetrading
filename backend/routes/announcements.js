// routes/announcements.js
const router = require('express').Router();
const Announcement = require('../models/Announcement');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Public — get active announcements for dashboard
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
router.post('/',    auth, isAdmin, require('../controllers/adminController').createAnnouncement);
router.delete('/:id', auth, isAdmin, require('../controllers/adminController').deleteAnnouncement);

module.exports = router;