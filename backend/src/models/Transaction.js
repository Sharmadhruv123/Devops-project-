const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  paymentRequest: {
    type: mongoose.Schema.ObjectId,
    ref: 'PaymentRequest',
    required: true
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  account: {
    type: mongoose.Schema.ObjectId,
    ref: 'PaymentAccount'
  },
  amount: {
    type: Number,
    required: [true, 'Please add transaction amount']
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Card', 'NetBanking', 'Cash', 'Other'],
    default: 'UPI'
  },
  razorpayPaymentId: {
    type: String
  },
  status: {
    type: String,
    enum: ['Success', 'Failed', 'Pending'],
    default: 'Success'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
