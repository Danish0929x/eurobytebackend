const Package = require('../models/Packages');

exports.createPackage = async (req, res) => {
  try {
    const { userId, packageAmount } = req.body;

    // Validate inputs
    if (!userId || !packageAmount) {
      return res.status(400).json({
        success: false,
        message: "User ID and Package Amount are required"
      });
    }

    // Validate package amount is a positive number
    if (isNaN(packageAmount) || packageAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Package Amount must be a positive number"
      });
    }

    // Create new package
    const newPackage = await Package.create({
      userId,
      packageAmount,
      startDate: new Date(),
      status: 'Active'
    });

    res.status(200).json({
      success: true,
      message: "Package created successfully",
      data: {
        packageId: newPackage._id,
        userId: newPackage.userId,
        packageAmount: newPackage.packageAmount,
        startDate: newPackage.startDate,
        status: newPackage.status
      }
    });

  } catch (error) {
    console.error("Error creating package:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create package",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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