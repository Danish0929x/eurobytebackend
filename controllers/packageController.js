const Package = require('../models/Packages');
const { distributeDirectBonus } = require("../functions/distributeDirectBonus");

exports.createPackage = async (req, res) => {
  try {
     const userId = req.user.userId; // Get userId from the request
    const { packageAmount } = req.body;

    if (!userId || !packageAmount) {
      return res.status(400).json({ message: "User ID and package amount are required" });
    }

    // Create a new package
    const newPackage = new Package({
      userId,
      packageAmount,
      ROI: 0,
      startDate: new Date(),
      status: "Active"
    });

    // Save the new package to the database
    await newPackage.save();

    // Call distributeDirectBonus after the package is saved
    await distributeDirectBonus(packageAmount, userId);  // Pass the packageAmount and userId to the function

    // Respond with success
    res.status(201).json({
      message: "Package created successfully and bonus distributed",
      data: newPackage
    });

  } catch (err) {
    console.error("Error creating package:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.getPackagesByUserId = async (req, res) => {
  try {

    const userId = req.user.userId;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    // Find all packages for the user
    const packages = await Package.find({ userId })
      .sort({ startDate: -1 }) // Sort by newest first
      .select('packageAmount startDate status createdAt');



    res.status(200).json({
      success: true,
      message: "Packages retrieved successfully",
      data: packages
    });

  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch packages",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};