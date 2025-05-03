const Transaction = require("../models/Transaction"); 


exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      transactionRemark,
      type // "credited" or "debited"
    } = req.body;

    // Build query object
    const query = { userId };

    // Filter by transactionRemark starting with...
    if (transactionRemark) {
      query.transactionRemark = { $regex: `^${transactionRemark}`, $options: 'i' };
    }


    // Filter by credited or debited
    if (type === 'credited') {
      query.creditedAmount = { $gt: 0 };
    } else if (type === 'debited') {
      query.debitedAmount = { $gt: 0 };
    }

    // Fetch filtered transactions
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(500);

    res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
