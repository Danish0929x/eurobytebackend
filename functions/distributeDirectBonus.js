// functions/distributeDirectBonus.js

const Package = require("../models/Package");
const User = require("../models/User");
const {
  performWalletTransaction,
} = require("../utils/performWalletTransaction");

async function distributeDirectBonus(packageAmount, userId) {
  try {
    // Get the user who purchased the package (the userId is passed as a parameter)
    const user = await User.findOne({ userId });
    if (!user || !user.referrer) {
      console.log(`No referrer found for user ${userId}`);
      return; // If no referrer is found, stop the process
    }

    // console.log("Referrer ID:", user.referrer);

    // Calculate 10% of the package amount
    const bonusAmount = packageAmount * 0.1;
    console.log(`Bonus to add to referrer ${user.referrer}: ${bonusAmount}`);

    // Prepare transaction remark
    const transactionRemark = `Direct Bonus from User ${userId}`;
   
    // ✅ Check if referrer has at least one active package
    const referrerHasActivePackage = await Package.exists({
      userId: user.referrer,
      status: "Active"
    });

    if (!referrerHasActivePackage) {
      console.log(`Referrer ${user.referrer} has no active package. Bonus not distributed.`);
      return;
    }

    // Call performWalletTransaction to handle the bonus distribution to the referrer
    await performWalletTransaction(
      user.referrer, // Referrer's userId
      bonusAmount, // Bonus amount (10% of package)
      transactionRemark, // Transaction remark
      "Completed" // Status of the transaction
    );

    console.log(
      `Added ${bonusAmount} USDT to referrer ${user.referrer}'s wallet`
    );
  } catch (error) {
    console.error("Error during direct bonus distribution:", error);
  }
}

module.exports = { distributeDirectBonus };
