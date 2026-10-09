const twilio = require('twilio');
const NotificationLog = require('../models/NotificationLog');

const sendSMS = async (options) => {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Check if WhatsApp or SMS
    const isWhatsApp = options.isWhatsApp;
    const fromNumber = isWhatsApp ? process.env.TWILIO_WHATSAPP_NUMBER : process.env.TWILIO_PHONE_NUMBER;
    const toNumber = isWhatsApp ? `whatsapp:+91${options.phone}` : `+91${options.phone}`;

    const message = await client.messages.create({
      body: options.message,
      from: fromNumber,
      to: toNumber
    });

    console.log(`Message sent: ${message.sid}`);

    if (options.customerId) {
      await NotificationLog.create({
        customer: options.customerId,
        type: isWhatsApp ? 'WhatsApp' : 'SMS',
        status: 'Sent',
        message: 'Payment notification sent'
      });
    }
  } catch (error) {
    console.error('Twilio Error:', error);
    if (options.customerId) {
      await NotificationLog.create({
        customer: options.customerId,
        type: options.isWhatsApp ? 'WhatsApp' : 'SMS',
        status: 'Failed',
        message: 'Payment notification failed',
        errorDetails: error.message
      });
    }
  }
};

module.exports = sendSMS;
