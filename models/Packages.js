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
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);