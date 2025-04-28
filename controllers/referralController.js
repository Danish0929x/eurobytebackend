const User = require("../models/User");

// ROUTE: 1 Get referral name: GET "/api/auth/getreferralname/:id". It requires auth
async function getReferralNameById(req, res) {
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
}
async function getReferrals(req, res) {
  const userId = req.user.userId;
  const { depthLimit } = req.body;

  try {
    const user = await User.findOne({ userId: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const referrals = await getReferralTree(userId, depthLimit);

    // Flatten the referral tree into a single array
    const flattened = referrals.map((ref, index) => ({
      sn: index + 1, // Add serial number (sn)
      userId: ref.userId || "none",
      name: ref.Name || "none",
      referrer: ref.referrer || "none",
      registrationDate: ref.RegistrationDate || "none",
      investmentAmount: ref.InvestedAmount || 0,
      level: ref.Level,
      status: ref.InvestedAmount > 0 ? "Active" : "Inactive",
    }));

    res.json({
      success: true,
      message: "Referral tree fetched successfully",
      data: flattened,
    });

  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ message: "Error fetching referrals", error: error.message });
  }
}

async function getReferralTree(userId, depthLevel = 5) {
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
        maxDepth: depthLevel - 1, // Subtract 1 because we start counting from the userId
        depthField: "level",
        as: "referrals",
      },
    },
    {
      $unwind: "$referrals",
    },
    {
      $project: {
        userId: "$referrals.userId",
        referrer: "$referrals.referrer", // Referrer is now included in the projection
        Name: "$referrals.fullname",
        RegistrationDate: "$referrals.createdAt",
        Level: { $add: ["$referrals.level", 1] }, // Add 1 to the level for better clarity
        InvestedAmount: { $literal: 0 }, // Placeholder for InvestedAmount, adjust if needed
      },
    },
    {
      $sort: { Level: 1, RegistrationDate: 1 }, // Sorting by Level and then Registration Date
    },
  ];

  try {
    const response = await User.aggregate(pipeline).exec();
    return response;
  } catch (error) {
    console.error("Error in aggregation:", error);
    throw error;
  }
}





// EXPORTS
module.exports = {
  getReferralNameById,
  getReferrals,
}
