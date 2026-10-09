const mongoose = require('mongoose');

const PaymentRequestSchema = new mongoose.Schema({
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
    required: [true, 'Please add an amount']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date']
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Partially Paid', 'Overdue'],
    default: 'Pending'
  },
  paymentLink: {
    type: String
  },
  qrCode: {
    type: String
  },
  razorpayOrderId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PaymentRequest', PaymentRequestSchema);
