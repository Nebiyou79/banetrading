// routes/support.js
const router = require('express').Router();
const support = require('../controllers/supportController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { validate, supportMessageSchema } = require('../middleware/validate');

// User routes
router.post('/message',  auth, validate(supportMessageSchema), support.sendMessage);
router.get('/messages',  auth, support.getMyMessages);

// Admin routes
router.get('/admin/conversations',          auth, isAdmin, support.getAllConversations);
router.get('/admin/messages/:userId',       auth, isAdmin, support.getUserMessages);
router.post('/admin/reply',                 auth, isAdmin, support.adminReply);
router.put('/admin/read/:userId',           auth, isAdmin, support.markAsRead);

module.exports = router;