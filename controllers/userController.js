const express = require("express");
const User = require("../models/User");
const Profile = require("../models/profile");
const Wallet = require("../models/Wallet");

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
  try {
    const { userId, fullName, withdrawalAddress } = req.body;

    // Validate userId matches authenticated user
    if (userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this profile",
      });
    }

    // Find and validate profile
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Prepare update
    const updates = {};
    if (fullName !== undefined) updates.fullname = fullName;
    if (withdrawalAddress !== undefined)
      updates.withdrawAddress = withdrawalAddress;

    // Apply updates
    const updatedProfile = await Profile.findOneAndUpdate({ userId }, updates, {
      new: true,
      runValidators: true,
    });

    // Sync name to User model if changed
    if (fullName !== undefined) {
      await User.findOneAndUpdate({ userId }, { fullname: fullName });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({
      success: false,
      message: "Profile update failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
      fullname: profile.fullname,
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
