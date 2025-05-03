const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const { performWalletTransaction } = require("../utils/permorfWalletTransaction");

const withdrawUSDT = async (req, res) => {
  try {
    const userId = req.user.userId; 
    const { amount } = req.body;

    // Validation
    if (!amount || amount < 10) {
      return res.status(400).json({ error: "Minimum withdrawal amount is $10" });
    }
    if (amount > 500) {
      return res.status(400).json({ error: "Maximum withdrawal amount is $500" });
    }

    // Get wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    if (wallet.USDTBalance < amount) {
      return res.status(400).json({ error: "Insufficient USDT balance" });
    }

    // Check daily withdrawal
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyWithdrawn = await Transaction.findOne({
      userId,
      debitedAmount: { $gt: 0 },
      transactionRemark: "USDT Withdraw",
      date: { $gte: today },
    });

    if (alreadyWithdrawn) {
      return res.status(400).json({ error: "You can only withdraw USDT once per day" });
    }

    // Perform the transaction
    await performWalletTransaction(userId, -amount, "USDT Withdraw - USDT Withdraw", "Pending")
      

    res.status(200).json({ message: "Withdrawal request submitted successfully" });

  } catch (error) {
    console.error("Withdraw USDT error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  withdrawUSDT
};
