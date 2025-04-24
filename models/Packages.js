const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  packageAmount: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
//   packageType: {
//     type: String,
//     enum: ['basic', 'standard', 'premium'],
//     required: true
//   },
//   transactions: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Transaction'
//   }]
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);