const User = require("../models/User");
const mongoose = require("mongoose");

// ROUTE: 1 Get referral name
exports.getReferralNameById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findOne({ userId: id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Referral name fetched successfully",
      data: {
        fullName: user.fullname,
        userId: user.userId,
      },
    });
  } catch (error) {
    console.error("Error fetching referral name:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ROUTE: 2 Get referral tree
exports.getReferrals = async (req, res) => {
  try {
    const { userId, depthLevel } = req.body; 

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Verify user exists
    const member = await User.findOne({ userId });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get full referral tree
    const referralTree = await getReferralTree(userId, depthLevel);

    res.status(200).json({
      success: true,
      data: referralTree,
      message: "Referral tree retrieved successfully"
    });

  } catch (error) {
    console.error("Error getting referrals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get referrals",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

async function getReferralTree(userId, depthLevel = 16) {
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
        maxDepth: depthLevel - 1, // depth is 0-indexed
        depthField: "Level",
        as: "Referrals",
      },
    },
    {
      $unwind: "$Referrals",
    },
    {
      $lookup: {
        from: "rewards",
        localField: "Referrals.userId",
        foreignField: "userId",
        as: "ReferralRewards",
      },
    },
    {
      $lookup: {
        from: "profiles",
        localField: "Referrals.userId",
        foreignField: "userId",
        as: "ReferralProfile",
      },
    },
    {
      $lookup: {
        from: "packages",
        localField: "Referrals.userId",
        foreignField: "userId",
        as: "ReferralPackages",
      },
    },
    {
      $project: {
        _id: 0,
        userId: "$Referrals.userId",
        Level: { $add: ["$Referrals.Level", 1] }, // make it 1-indexed
        Name: { $arrayElemAt: ["$ReferralProfile.fullname", 0] },
        InvestedAmount: {
          $sum: "$ReferralPackages.packageAmount"
        },
        teamBusiness: { $arrayElemAt: ["$ReferralRewards.teamBusiness", 0] },
        RegistrationDate: "$Referrals.timeOfEvent",
      },
    },
    {
      $sort: { Level: 1, InvestedAmount: -1 },
    },
  ];

  try {
    return await User.aggregate(pipeline).exec();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
