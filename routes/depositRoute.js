const express = require("express");
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const depositController = require("../controllers/depositController");

router.post("/deposit-usdt", authMiddleware, depositController.depositUSDTController);

module.exports = router;
