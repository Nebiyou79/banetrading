// routes/admin.js
const router = require('express').Router();
const admin = require('../controllers/adminController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { validate, updateUserSchema, announcementSchema } = require('../middleware/validate');

// All admin routes require auth + admin role
router.use(auth, isAdmin);

// Dashboard
router.get('/stats', admin.getDashboardStats);

// Users
router.get('/users',            admin.getAllUsers);
router.get('/users/:id',        admin.getUserById);
router.put('/users/:id',        validate(updateUserSchema), admin.updateUser);
router.delete('/users/:id',     admin.deleteUser);

// Trades
router.get('/trades',           admin.getAllTrades);

// Deposits
router.get('/deposits',         admin.getAllDeposits);
router.get('/deposits/pending', admin.getPendingDeposits);
router.put('/deposits/:depositId/approve', admin.approveDeposit);
router.put('/deposits/:depositId/reject',  admin.rejectDeposit);   // FIX B4: PUT not DELETE

// Withdrawals
router.get('/withdrawals',         admin.getAllWithdrawals);
router.get('/withdrawals/pending', admin.getPendingWithdrawals);
router.put('/withdrawals/:withdrawalId/approve', admin.approveWithdrawal);
router.put('/withdrawals/:withdrawalId/reject',  admin.rejectWithdrawal);   // FIX B2

// KYC
router.get('/kyc',                         admin.getAllKycRequests);
router.put('/kyc/:userId/approve',         admin.approveKyc);   // FIX B1
router.put('/kyc/:userId/reject',          admin.rejectKyc);

// Announcements
router.post('/announcements',     validate(announcementSchema), admin.createAnnouncement);
router.delete('/announcements/:id', admin.deleteAnnouncement);

module.exports = router;