// routes/support.js
// ── Support routes (tickets + config) ──

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/supportController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { validate } = require('../middleware/validate');
const { uploadAvatar } = require('../middleware/upload');

// ── Validate schemas (referenced from validate.js) ──
const {
  ticketCreateSchema,
  ticketMessageSchema,
  ticketStatusSchema,
  supportConfigSchema,
} = require('../middleware/validate');

// ── Public ──
router.get('/config', ctrl.getConfig);

// ── User endpoints ──
router.get('/tickets',             auth,                                          ctrl.listTickets);
router.post('/tickets',            auth, uploadAvatar.single('attachment'),       validate(ticketCreateSchema),  ctrl.createTicket);
router.get('/tickets/:id',         auth,                                          ctrl.getTicket);
router.post('/tickets/:id/messages', auth, uploadAvatar.single('attachment'),     validate(ticketMessageSchema), ctrl.sendMessage);
router.post('/tickets/:id/read',   auth,                                          ctrl.markRead);
router.post('/tickets/:id/close',  auth,                                          ctrl.closeTicket);

// ── Admin endpoints ──
router.get('/admin/tickets',              auth, isAdmin,                          ctrl.adminListTickets);
router.post('/admin/tickets/:id/messages', auth, isAdmin, uploadAvatar.single('attachment'), validate(ticketMessageSchema), ctrl.adminSendMessage);
router.post('/admin/tickets/:id/read',    auth, isAdmin,                          ctrl.adminMarkRead);
router.patch('/admin/tickets/:id',        auth, isAdmin, validate(ticketStatusSchema), ctrl.adminUpdateTicket);
router.get('/admin/config',               auth, isAdmin,                          ctrl.adminGetConfig);
router.put('/admin/config',               auth, isAdmin, validate(supportConfigSchema), ctrl.adminUpdateConfig);

module.exports = router;