const express = require("express");
const User = require("../models/User");
const Profile = require("../models/profile");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const { getTeamBusiness, calculateTotalInvestment } = require("../utils/getTeamBusiness");

// ROUTE: 1 Get logged in user details: GET "/api/auth/getuser". It requires auth
exports.getUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find by your custom userId field instead of _id
    const user = await User.findOne({ userId }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// ROUTE: 2 Update profile: PUT "/api/user/update-profile". It may require auth
exports.updateProfile = async (req, res) => {
  const userId = req.user.userId;
  try {
    const { fullname, phone, withdrawalAddress } = req.body;

    // Validate userId matches authenticated user
    if (userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this profile",
      });
    }

    // Prepare User updates
    const userUpdates = {};
    if (fullname !== undefined) userUpdates.fullname = fullname;
    if (phone !== undefined) userUpdates.phone = phone;

    // Prepare Profile updates
    const profileUpdates = {};
    if (withdrawalAddress !== undefined) profileUpdates.withdrawAddress = withdrawalAddress;

    // If nothing to update
    if (Object.keys(userUpdates).length === 0 && Object.keys(profileUpdates).length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    // Parallel updates
    await Promise.all([
      User.findOneAndUpdate({ userId }, userUpdates, { new: true, runValidators: true }),
      Profile.findOneAndUpdate({ userId }, profileUpdates, { new: true, runValidators: true }),
    ]);

    // Fetch updated data
    const [updatedUser, updatedProfile] = await Promise.all([
      User.findOne({ userId }),
      Profile.findOne({ userId }),
    ]);

    if (!updatedUser || !updatedProfile) {
      return res.status(404).json({ success: false, message: "Profile not found after update" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        userId: updatedUser.userId,
        email: updatedUser.email,
        fullname: updatedUser.fullname, // ➡️ Added fullname here
        withdrawAddress: updatedProfile.withdrawAddress || "",
        status: updatedUser.status,
        joinDate: updatedUser.createdAt
      }
    });

  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({
      success: false,
      message: "Profile update failed",
    });
  }
};


// ROUTE 3: Get user profile - GET "/api/user/get-profile"
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user by custom userId (EUR12345)
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find profile using the same custom userId
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found for this user",
      });
    }

    // Combine relevant data
    const profileData = {
      userId: user.userId,
      fullname: user.fullname,  // Fetch fullname from User model instead of Profile
      email: user.email,
      phone: profile.phone,
      withdrawAddress: profile.withdrawAddress,
      status: user.status,
      isVerified: user.isVerified,
      joinDate: profile.createdAt,
    };

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: profileData,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


// ROUTE 4: Get user wallet - GET "/api/user/get-wallet"
exports.getWallet = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user by custom userId (EUR12345)
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find wallet using the same custom userId
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    // Combine relevant data
    const walletData = {
      userId: wallet.userId,
      USDTBalance: wallet.USDTBalance,
      depositBalance: wallet.depositBalance,
      fullname: user.fullname,
      email: user.email,
      withdrawAddress: wallet.withdrawAddress,
      lastUpdated: wallet.updatedAt,
      status: user.status,
    };

    res.status(200).json({
      success: true,
      message: "Wallet retrieved successfully",
      data: walletData,
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get wallet",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


exports.getDashboard = async (req, res) => {
  const userId = req.user.userId;

  try {
    // 1. Get the total investment for the user (direct investment)
    const totalInvestment = await calculateTotalInvestment(userId);

    // 2. Get the total team business (sum of investments of downline users)
    // const totalTeamBusiness = await getTeamBusiness(userId);

    // 3. Get the USDT balance for the user
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const usdtBalance = wallet.USDTBalance;

    // 4. Get the sum of each type of bonus
    const bonuses = {
      directBonus: 0,
      roi: 0,
      growthLevelRoi: 0,
      salaryIncome: 0,
      royaltyIncome: 0,
    };

    // Query transactions for the user where the transactionRemark starts with each of the bonus types
    const transactions = await Transaction.find({ userId });

    transactions.forEach((transaction) => {
      const { transactionRemark, creditedAmount } = transaction;

      // Check the transactionRemark and sum up the creditedAmount based on the type
      if (transactionRemark.startsWith("Direct Bonus")) {
        bonuses.directBonus += creditedAmount;
      } else if (transactionRemark.startsWith("ROI")) {
        bonuses.roi += creditedAmount;
      } else if (transactionRemark.startsWith("Growth Level ROI")) {
        bonuses.growthLevelRoi += creditedAmount;
      } else if (transactionRemark.startsWith("Salary Income")) {
        bonuses.salaryIncome += creditedAmount;
      } else if (transactionRemark.startsWith("Royalty Income")) {
        bonuses.royaltyIncome += creditedAmount;
      }
    });

    // 5. Get Direct Team count (users whose referrer is this user)
    const directTeamCount = await User.countDocuments({ referrer: userId });

    // 6. Calculate Total Income Earned (sum of all bonus types)
    const totalIncomeEarned = bonuses.directBonus + bonuses.roi + bonuses.growthLevelRoi + bonuses.salaryIncome + bonuses.royaltyIncome;

    // 7. Return all the data in response
    res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: {
        totalInvestment, // Direct investment of the current user
        // totalTeamBusiness, // Uncomment this if team business is needed
        usdtBalance, // USDT balance for the current user
        directTeamCount, // The number of users in the direct team
        totalIncomeEarned, // Total of all the bonus types
        bonuses, // Object containing all 5 bonus types
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
