const Transaction = require("../models/Transaction"); 

exports.getTransactions = async (req, res) => {
    try {
      const userId = req.user.userId;
      const { limit = 500, startWith = "" } = req.query;  // Default limit to 10 and startWith to an empty string
  
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }
  
      // Ensure the limit is a positive integer (sanitize input)
      const parsedLimit = parseInt(limit);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid limit parameter. It must be a positive integer.",
        });
      }
  
      // Build the query object
      const query = { userId };
      
      if (startWith) {
        // Use regex to filter transactions based on remarks starting with the provided string
        query.transactionRemark = { $regex: `^${startWith}`, $options: "i" }; // Case-insensitive match
      }
  
      // Fetch transactions with limit and filtering
      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 }) // Sort by date, latest first
        .limit(parsedLimit);     // Limit the number of results
  
      // Send an empty array if no transactions are found, but still a success status
      res.status(200).json({
        success: true,
        message: transactions.length > 0 ? "Transactions fetched successfully" : "No transactions found",
        data: transactions,  // Even if empty, still return an empty array
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
  
