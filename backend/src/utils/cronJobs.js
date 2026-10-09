const cron = require('node-cron');
const PaymentRequest = require('../models/PaymentRequest');
const Customer = require('../models/Customer');
const sendEmail = require('./sendEmail');
const sendSMS = require('./sendSMS');

const initCronJobs = () => {
  // Run every day at 10:00 AM to check for overdue payments
  cron.schedule('0 10 * * *', async () => {
    console.log('Running automated reminder cron job...');
    
    try {
      const now = new Date();
      // Find payments that are pending and past due date
      const overduePayments = await PaymentRequest.find({
        status: { $in: ['Pending', 'Partially Paid'] },
        dueDate: { $lt: now }
      }).populate('customer');

      for (const payment of overduePayments) {
        // Update status to Overdue if it's not already Paid
        if (payment.status !== 'Overdue') {
          payment.status = 'Overdue';
          await payment.save();

          const customer = payment.customer;
          if (customer && customer.paymentStatus !== 'Overdue') {
            customer.paymentStatus = 'Overdue';
            await customer.save();
          }

          // Send Overdue Reminder
          const messageText = `URGENT: Your payment of ₹${payment.amount} for "${payment.description}" is now overdue. Please pay immediately using this link: ${payment.paymentLink}`;

          if (customer.email) {
            sendEmail({
              email: customer.email,
              subject: 'Overdue Payment Reminder - PaySmart',
              message: messageText
            });
          }

          if (customer.contactNumber) {
            sendSMS({ phone: customer.contactNumber, message: messageText, isWhatsApp: true });
          }
        }
      }
      console.log(`Cron complete: processed ${overduePayments.length} overdue payments.`);
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });
};

module.exports = initCronJobs;
