const mongoose = require('mongoose');

const PaymentAccountSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: [true, 'Please add an account name'],
    trim: true,
  },
  description: {
    type: String,
  },
  provider: {
    type: String,
    enum: ['Razorpay', 'Stripe', 'Bank Transfer', 'UPI', 'Cash'],
    default: 'Razorpay'
  },
  providerDetails: {
    type: Object, // Can store API keys, bank account numbers, or UPI IDs specific to this account
    select: false // Hide by default for security
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalCollected: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PaymentAccount', PaymentAccountSchema);
