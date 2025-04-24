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
      status: 'active'
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