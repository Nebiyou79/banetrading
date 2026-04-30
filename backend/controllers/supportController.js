// controllers/supportController.js
// ── Support ticket controller ──

const SupportTicket = require('../models/SupportTicket');
const TicketMessage = require('../models/TicketMessage');
const SupportConfig = require('../models/SupportConfig');
const User = require('../models/User');

// ── Helper: check ticket access ──
function canAccessTicket(user, ticket) {
  return ticket.userId.toString() === user._id.toString() || user.role === 'admin';
}

// ── GET /api/support/config (public) ──
exports.getConfig = async (req, res) => {
  try {
    const config = await SupportConfig.findOne();
    if (!config) return res.json({ ticketsEnabled: true, whatsappEnabled: false, whatsappNumber: '', whatsappMessage: '' });
    return res.json({
      ticketsEnabled: config.ticketsEnabled,
      whatsappEnabled: config.whatsappEnabled,
      whatsappNumber: config.whatsappNumber,
      whatsappMessage: config.whatsappMessage,
    });
  } catch (err) {
    console.error('[support] getConfig error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/support/tickets (user's tickets) ──
exports.listTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user._id })
      .sort({ lastMessageAt: -1 })
      .lean();

    const enriched = await Promise.all(tickets.map(async (t) => {
      const lastMsg = await TicketMessage.findOne({ ticketId: t._id })
        .sort({ createdAt: -1 })
        .select('body')
        .lean();
      return { ...t, lastMessagePreview: lastMsg ? lastMsg.body.slice(0, 80) : '' };
    }));

    return res.json({ tickets: enriched });
  } catch (err) {
    console.error('[support] listTickets error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/support/tickets ──
exports.createTicket = async (req, res) => {
  try {
    const { subject, category, message } = req.body;

    const ticket = await SupportTicket.create({
      userId: req.user._id,
      subject,
      category: category || 'general',
      lastMessageAt: new Date(),
      unreadByAdmin: 1,
    });

    const msg = await TicketMessage.create({
      ticketId: ticket._id,
      senderId: req.user._id,
      senderRole: 'user',
      body: message,
      attachments: req.file ? [`/uploads/${req.file.filename}`] : [],
    });

    return res.status(201).json({ ticket, messages: [msg] });
  } catch (err) {
    console.error('[support] createTicket error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/support/tickets/:id ──
exports.getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!canAccessTicket(req.user, ticket)) return res.status(403).json({ message: 'Access denied' });

    const messages = await TicketMessage.find({ ticketId: ticket._id }).sort({ createdAt: 1 }).lean();
    return res.json({ ticket, messages });
  } catch (err) {
    console.error('[support] getTicket error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/support/tickets/:id/messages ──
exports.sendMessage = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!canAccessTicket(req.user, ticket)) return res.status(403).json({ message: 'Access denied' });

    const { body } = req.body;
    const msg = await TicketMessage.create({
      ticketId: ticket._id,
      senderId: req.user._id,
      senderRole: 'user',
      body,
      attachments: req.file ? [`/uploads/${req.file.filename}`] : [],
    });

    ticket.lastMessageAt = new Date();
    ticket.unreadByAdmin += 1;
    if (['resolved', 'closed'].includes(ticket.status)) {
      ticket.status = 'open';
    }
    await ticket.save();

    return res.status(201).json({ message: msg });
  } catch (err) {
    console.error('[support] sendMessage error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/support/tickets/:id/read ──
exports.markRead = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!canAccessTicket(req.user, ticket)) return res.status(403).json({ message: 'Access denied' });

    ticket.unreadByUser = 0;
    await ticket.save();
    return res.json({ success: true });
  } catch (err) {
    console.error('[support] markRead error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/support/tickets/:id/close ──
exports.closeTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only ticket owner can close' });

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    await ticket.save();
    return res.json({ ticket });
  } catch (err) {
    console.error('[support] closeTicket error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── Admin endpoints ──
exports.adminListTickets = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.subject = { $regex: req.query.search, $options: 'i' };

    const tickets = await SupportTicket.find(filter)
      .populate('userId', 'name email')
      .sort({ lastMessageAt: -1 })
      .lean();

    return res.json({ tickets });
  } catch (err) {
    console.error('[support] adminListTickets error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.adminSendMessage = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const { body } = req.body;
    const msg = await TicketMessage.create({
      ticketId: ticket._id,
      senderId: req.user._id,
      senderRole: 'admin',
      body,
      attachments: req.file ? [`/uploads/${req.file.filename}`] : [],
    });

    ticket.lastMessageAt = new Date();
    ticket.unreadByUser += 1;
    if (ticket.status === 'open') ticket.status = 'in_progress';
    await ticket.save();

    return res.status(201).json({ message: msg });
  } catch (err) {
    console.error('[support] adminSendMessage error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.adminMarkRead = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    ticket.unreadByAdmin = 0;
    await ticket.save();
    return res.json({ success: true });
  } catch (err) {
    console.error('[support] adminMarkRead error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.adminUpdateTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const { status, category, assignedTo } = req.body;
    if (status) ticket.status = status;
    if (category) ticket.category = category;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo || null;
    if (['resolved', 'closed'].includes(ticket.status)) ticket.closedAt = new Date();

    await ticket.save();
    return res.json({ ticket });
  } catch (err) {
    console.error('[support] adminUpdateTicket error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.adminGetConfig = async (req, res) => {
  try {
    let config = await SupportConfig.findOne();
    if (!config) config = await SupportConfig.create({});
    return res.json({ config });
  } catch (err) {
    console.error('[support] adminGetConfig error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.adminUpdateConfig = async (req, res) => {
  try {
    let config = await SupportConfig.findOne();
    if (!config) config = new SupportConfig();

    const { whatsappNumber, whatsappMessage, emailContact, ticketsEnabled, whatsappEnabled } = req.body;
    if (whatsappNumber !== undefined) config.whatsappNumber = whatsappNumber;
    if (whatsappMessage !== undefined) config.whatsappMessage = whatsappMessage;
    if (emailContact !== undefined) config.emailContact = emailContact;
    if (ticketsEnabled !== undefined) config.ticketsEnabled = ticketsEnabled;
    if (whatsappEnabled !== undefined) config.whatsappEnabled = whatsappEnabled;
    config.updatedBy = req.user._id;

    await config.save();
    return res.json({ config });
  } catch (err) {
    console.error('[support] adminUpdateConfig error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};