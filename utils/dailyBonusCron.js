const cron = require('node-cron');
const Wallet = require('../models/Wallet');
const Package = require('../models/Package');
const Transaction = require('../models/Transaction');

const DAILY_PROFIT_PERCENTAGE = 2; // 2% daily profit

async function distributeDailyBonus() {
  try {
    console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Starting daily bonus distribution...`);
    
    const activePackages = await Package.find({ status: 'active' });
    
    for (const pkg of activePackages) {
      const profitAmount = (pkg.packageAmount * DAILY_PROFIT_PERCENTAGE) / 100;
      
      await Wallet.findOneAndUpdate(
        { userId: pkg.userId },
        { $inc: { USDTBalance: profitAmount } },
        { upsert: true }
      );

      await Transaction.create({
        userId: pkg.userId,
        transactionRemark: 'daily_profit',
        creditedAmount: profitAmount,
        txn: `DP-${Date.now()}-${pkg.userId}`,
        status: 'completed',
        metadata: {
          packageId: pkg._id,
          distributedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        }
      });
    }
    
    console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Distribution completed. Processed ${activePackages.length} packages.`);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Error:`, error);
  }
}

function startDailyBonusCron() {
  // Schedule for 12:00 AM IST (5:30 AM UTC)
  cron.schedule('30 5 * * *', distributeDailyBonus, { // 5:30 UTC = 12:00 AM IST
    scheduled: true,
    timezone: "Asia/Kolkata" // Explicitly set IST timezone
  });
  
  console.log('⏰ Daily bonus cron job scheduled for 12:00 AM IST (5:30 AM UTC)');
}

module.exports = { startDailyBonusCron, distributeDailyBonus }; 