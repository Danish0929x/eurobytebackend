const { ethers } = require("ethers");
const Transaction = require("../models/Transaction");
const { performWalletTransaction } = require("../utils/permorfWalletTransaction");

const ADMIN_WALLET_ADDRESS = process.env.ADMIN_DEPOSIT_WALLET_ADDRESS.toLowerCase();
const USDT_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const BSC_RPC_URL = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/";

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];


const depositUSDTController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userWalletAddress = req.body.userWalletAddress; // from frontend wallet connect
    const { txHash, amount } = req.body;

    if (!txHash || !amount || !userWalletAddress) {
      return res.status(400).json({ error: "txHash, amount, and userWalletAddress are required" });
    }

    const txRecord = await verifyAndRecordDeposit(userId, userWalletAddress, txHash, amount);

    res.status(200).json({ message: "Deposit confirmed and recorded", transaction: txRecord });
  } catch (error) {
    console.error("Deposit error:", error);
    res.status(400).json({ error: error.message });
  }
};


async function verifyAndRecordDeposit(userId, userWalletAddress, txHash, amount) {
  try {
    // Initialize provider with the correct RPC URL
    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);

    // 1) Check for duplicate txHash in DB
    const existingTx = await Transaction.findOne({ transactionHash: txHash });
    if (existingTx) {
      throw new Error("This deposit transaction has already been processed");
    }

    // 2) Fetch transaction receipt & verify success
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      throw new Error("Transaction not found or failed");
    }

    // 3) Verify transaction is a USDT transfer to admin wallet
    const tx = await provider.getTransaction(txHash);
    if (tx.to.toLowerCase() !== USDT_CONTRACT_ADDRESS.toLowerCase()) {
      throw new Error("Transaction is not a USDT transfer");
    }

    // 4) Record the deposit by crediting user's wallet & creating transaction log
    const txRecord = await performWalletTransaction(
      userId,
      amount,
      "depositBalance",
      "USDT Deposit - USDT Deposit",
      "Completed"
    );

    // 5) Save txHash on transaction document
    txRecord.txn = txHash;
    await txRecord.save();

    return txRecord;
  } catch (err) {
    console.error("Error verifying and recording deposit:", err);
    throw err;
  }
}





module.exports = { verifyAndRecordDeposit, depositUSDTController  };
