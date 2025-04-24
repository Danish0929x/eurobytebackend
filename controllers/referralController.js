const User = require("../models/User");
const mongoose = require("mongoose");

// Helper function to get referral tree (updated)
const getReferralTree = async (userId, depthLevel = 5) => {
  try {
    const pipeline = [
      {
        $match: { userId: userId }, // Match by userId string
      },
      {
        $graphLookup: {
          from: "users",
          startWith: "$userId",
          connectFromField: "userId",
          connectToField: "referrer",
          maxDepth: depthLevel,
          depthField: "level",
          as: "referrals",
          restrictSearchWithMatch: {
            verified: true,
            status: "Active",
          },
        },
      },
      { $unwind: "$referrals" },
      {
        $group: {
          _id: "$referrals.level",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const results = await User.aggregate(pipeline);

    const referralCounts = {};
    results.forEach((item) => {
      referralCounts[`Level${item._id + 1}`] = item.count;
    });

    return referralCounts;
  } catch (error) {
    console.error("Error in getReferralTree:", error);
    throw error;
  }
};

// ROUTE: 1 Get referral name: GET "/api/auth/getreferralname/:id". It requires auth
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

// ROUTE: 2 Get referral count: GET "/api/auth/getreferralcount". It requires auth
exports.getReferrals = async (req, res) => {
  try {
    const userId = req.params.userId || req.body.userId;

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

    // Pass userId string instead of _id
    const referralCountByLevel = await getReferralTree(userId);

    // Format response
    const response = {
      success: true,
      referralCountByLevel: {
        Level1: referralCountByLevel.Level1 || 0,
        Level2: referralCountByLevel.Level2 || 0,
        Level3: referralCountByLevel.Level3 || 0,
        Level4: referralCountByLevel.Level4 || 0,
        Level5: referralCountByLevel.Level5 || 0,
      },
    };

    // Add message if no referrals
    if (
      Object.values(response.referralCountByLevel).every((count) => count === 0)
    ) {
      response.message = "No active referrals found";
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting referrals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get referrals",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
