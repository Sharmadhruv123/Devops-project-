const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please add a full name'],
    trim: true,
  },
  secondPersonName: {
    type: String,
    trim: true,
  },
  contactNumber: {
    type: String,
    required: [true, 'Please add a contact number'],
    match: [/^\d{10,15}$/, 'Please add a valid phone number'],
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  pendingAmount: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Partially Paid', 'Overdue'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Customer', CustomerSchema);
