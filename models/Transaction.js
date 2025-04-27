const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  transactionRemark: {
    type: String,
  },
  creditedAmount: {
    type: Number,
    default: 0,
  },
  debitedAmount: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now
  },
  txn: {
    type: String
  },
  currentBalance: {
    type: "Number"
  },
  status: {
    type: String,
    required: true
  },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);