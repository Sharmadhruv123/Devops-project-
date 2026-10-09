const nodemailer = require('nodemailer');
const NotificationLog = require('../models/NotificationLog');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);

    if (options.customerId) {
      await NotificationLog.create({
        customer: options.customerId,
        type: 'Email',
        status: 'Sent',
        message: options.subject
      });
    }
  } catch (error) {
    console.error('Email could not be sent', error);
    if (options.customerId) {
      await NotificationLog.create({
        customer: options.customerId,
        type: 'Email',
        status: 'Failed',
        message: options.subject,
        errorDetails: error.message
      });
    }
  }
};

module.exports = sendEmail;
