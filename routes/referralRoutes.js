const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protected routes (require authentication)
router.get('/getreferralname/:id', authMiddleware, referralController.getReferralNameById);
router.get('/getreferralcount', authMiddleware, referralController.getReferrals);

module.exports = router;