const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protected routes (require authentication)
router.get('/getreferralname/:id', referralController.getReferralNameById);
router.post('/getreferrals', authMiddleware, referralController.getReferrals);
router.get("/get-team-business", authMiddleware, referralController.getTeamBusinessController);

module.exports = router;