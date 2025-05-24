const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const { performWalletTransaction } = require("../utils/permorfWalletTransaction");

const withdrawUSDT = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    // 1) Amount validation
    if (!amount || amount < 10) {
      return res.status(400).json({ error: "Minimum withdrawal amount is $10" });
    }
    if (amount > 1000) {
      return res.status(400).json({ error: "Maximum withdrawal amount is $500" });
    }

    // 2) Wallet lookup & balance check
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    if (wallet.USDTBalance < amount) {
      return res.status(400).json({ error: "Insufficient USDT balance" });
    }

    // 3) One-withdrawal-per-calendar-day guard
    const now = new Date();
    const withdrawnToday = await Transaction.findOne({
      userId,
      debitedAmount: { $gt: 0 },
      transactionRemark: "USDT Withdraw - USDT Withdrawal",
      $expr: {
        $and: [
          { $eq: [{ $year:  "$createdAt" }, now.getFullYear()] },
          { $eq: [{ $month: "$createdAt" }, now.getMonth() + 1] },
          { $eq: [{ $dayOfMonth: "$createdAt" }, now.getDate()] }
        ]
      }
    });
    if (withdrawnToday) {
      return res
        .status(400)
        .json({ error: "You can only withdraw USDT once per day" });
    }

    // 4) Record the withdrawal
    await performWalletTransaction(
      userId,
      -amount,
      "USDTBalance",
      "USDT Withdraw - USDT Withdrawal",
      "Pending"
    );

    res.status(200).json({ message: "Withdrawal request submitted successfully" });
  } catch (error) {
    console.error("Withdraw USDT error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { withdrawUSDT };
