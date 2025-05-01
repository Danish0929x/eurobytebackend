const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");


/**
 * Perform a credit or debit against the user's USDTBalance,
 * then log it as a Transaction.
 *
 * @param {String} userId
 * @param {Number|String} amount      Positive to credit, negative to debit
 * @param {String} transactionRemark
 * @param {String} status            e.g. "Pending" or "Completed"
 * @returns {Promise<Transaction>}
 */
async function performWalletTransaction(
  userId,
  amount,
  transactionRemark,
  status
) {
  const amt = Number(amount);
  if (isNaN(amt)) throw new Error('Invalid amount');

  const wallet = await Wallet.findOne({ userId });
  if (!wallet) throw new Error("User's wallet not found");

  // For debits on Pending/Completed, enforce balance check
  if ((status === 'Completed' || status === 'Pending') && amt < 0) {
    if (wallet.USDTBalance < Math.abs(amt)) {
      throw new Error('Insufficient balance for the debit transaction');
    }
  }

  // Apply immediately for Pending/Completed
  if (status === 'Completed' || status === 'Pending') {
    wallet.USDTBalance += amt;
    await wallet.save();
  }

  const tx = new Transaction({
    userId,
    transactionRemark,
    creditedAmount: amt > 0 ? amt : 0,
    debitedAmount:  amt < 0 ? Math.abs(amt) : 0,
    status,
    currentBalance: wallet.USDTBalance
  });

  return tx.save();
}


/**
 * Change a transaction's status. If marking a previous debit as "Failed",
 * refund that amount back into the wallet.
 *
 * @param {String} transactionId
 * @param {String} newStatus         e.g. "Failed" | "Completed"
 * @returns {Promise<Transaction>}
 */
async function updateTransactionStatus(transactionId, newStatus) {
  const tx = await Transaction.findById(transactionId);
  if (!tx) throw new Error('Transaction not found');

  // On transition to Failed, if it was a debit, refund it
  if (newStatus === 'Failed' && tx.debitedAmount > 0 && tx.status !== 'Failed') {
    const wallet = await Wallet.findOne({ userId: tx.userId });
    if (!wallet) throw new Error("User's wallet not found");

    wallet.USDTBalance += tx.debitedAmount;
    await wallet.save();

    tx.currentBalance = wallet.USDTBalance;
  }

  tx.status = newStatus;
  return tx.save();
}


module.exports = {
  performWalletTransaction,
  updateTransactionStatus,
};
