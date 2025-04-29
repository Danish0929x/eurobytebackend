const Package = require("../models/Packages");
const User = require("../models/User");

// ROUTE: Get Team Business for a User: GET "/api/user/get-team-business". It requires auth
async function getTeamBusiness(userId) {
    try {
      // 1. Fetch the user's referral tree (downline)
      const referralTree = await getReferralTree(userId);
  
      // 2. For each user in the referral tree, calculate their total investment
      let totalBusiness = 0;
  
      for (const user of referralTree) {
        const userInvestment = await calculateTotalInvestment(user.userId);
        totalBusiness += userInvestment;
      }
  
      return totalBusiness;
  
    } catch (error) {
      console.error("Error calculating team business:", error);
      throw new Error("Error calculating team business");
    }
  }
// Fetch referral tree (downline) for a given user using aggregation
async function getReferralTree(userId) {
  const pipeline = [
    {
      $match: { userId: userId },
    },
    {
      $graphLookup: {
        from: "users",
        startWith: "$userId",
        connectFromField: "userId",
        connectToField: "referrer",
        maxDepth: 10,  // Adjust the depth according to your needs
        depthField: "level",
        as: "referrals",
      },
    },
    {
      $unwind: "$referrals",  // Unwind the referrals array
    },
    {
      $project: {
        userId: "$referrals.userId",
        referrer: "$referrals.referrer",
        level: "$referrals.level",
      },
    },
    {
      $sort: { level: 1 }, // Sorting by level (to get the depth of referrals)
    },
  ];

  try {
    const response = await User.aggregate(pipeline).exec();
    return response;
  } catch (error) {
    console.error("Error fetching referral tree:", error);
    throw error;
  }
}

// Calculate total investment for a given user (sum of packageAmount)
async function calculateTotalInvestment(userId) {
  try {
    const packages = await Package.aggregate([
      {
        $match: { userId: userId }, // Match the userId in the Package collection
      },
      {
        $group: {
          _id: "$userId", // Group by userId
          totalInvestment: { $sum: "$packageAmount" }, // Sum the packageAmount for this user
        },
      },
    ]);

    return packages.length > 0 ? packages[0].totalInvestment : 0; // Return total investment or 0 if no packages
  } catch (error) {
    console.error("Error calculating total investment:", error);
    throw error;
  }
}

async function calculateTotalInvestment(userId) {
    try {
      const packages = await Package.aggregate([
        {
          $match: { userId: userId }, // Match the userId in the Package collection
        },
        {
          $group: {
            _id: "$userId", // Group by userId
            totalInvestment: { $sum: "$packageAmount" }, // Sum the packageAmount for this user
          },
        },
      ]);
  
      return packages.length > 0 ? packages[0].totalInvestment : 0; // Return total investment or 0 if no packages
    } catch (error) {
      console.error("Error calculating total investment:", error);
      throw error;
    }
  }
  

module.exports = {
  getTeamBusiness,
  calculateTotalInvestment
};
