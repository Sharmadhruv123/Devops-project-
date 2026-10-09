const mongoose = require('mongoose');

const NotificationLogSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  paymentRequest: {
    type: mongoose.Schema.ObjectId,
    ref: 'PaymentRequest'
  },
  type: {
    type: String,
    enum: ['Email', 'SMS', 'WhatsApp'],
    required: true
  },
  status: {
    type: String,
    enum: ['Sent', 'Failed'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  errorDetails: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NotificationLog', NotificationLogSchema);
