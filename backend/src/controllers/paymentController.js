const ErrorResponse = require('../utils/errorHandler');
const PaymentRequest = require('../models/PaymentRequest');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const razorpayInstance = require('../utils/razorpay');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

// @desc    Get all payment requests
// @route   GET /api/v1/payments
// @access  Private
exports.getPaymentRequests = async (req, res, next) => {
  try {
    const payments = await PaymentRequest.find()
      .populate('customer', 'fullName contactNumber totalAmount pendingAmount secondPersonName')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a payment request
// @route   POST /api/v1/payments
// @access  Private
exports.createPaymentRequest = async (req, res, next) => {
  try {
    const { customerId, amount, description, dueDate } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return next(new ErrorResponse(`Customer not found with id of ${customerId}`, 404));
    }

    let paymentLinkData = { 
      short_url: `${process.env.FRONTEND_URL || 'http://localhost:5345'}/dummy-checkout`, 
      id: 'sim_pay_' + Date.now() 
    };

    try {
      // Create a Razorpay Order first (Optional, but good for QR/tracking)
      // Actually, Payment Links are standalone in Razorpay
      if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('placeholder')) {
        const rzpLink = await razorpayInstance.paymentLink.create({
          amount: amount * 100, // Amount in paise
          currency: 'INR',
          accept_partial: true,
          description: description,
          customer: {
            name: customer.fullName,
            contact: customer.contactNumber,
            email: customer.email || undefined,
          },
          notify: {
            sms: false, // We will handle our own notifications later
            email: false
          },
          reminder_enable: false,
          expire_by: Math.floor(new Date(dueDate).getTime() / 1000)
        });

        paymentLinkData = { short_url: rzpLink.short_url, id: rzpLink.id };
      }
    } catch (rzpErr) {
      console.error('Razorpay Error:', rzpErr);
    }

    const paymentRequest = await PaymentRequest.create({
      customer: customer._id,
      amount,
      description,
      paymentLink: paymentLinkData.short_url,
      razorpayOrderId: paymentLinkData.id,
      status: 'Pending',
      dueDate
    });

    // Append order ID to dummy link so it knows what to process
    if (paymentLinkData.short_url.includes('dummy-checkout')) {
      paymentLinkData.short_url = `${paymentLinkData.short_url}?orderId=${paymentLinkData.id}&amount=${amount}`;
    }

    // Update customer pending amount
    customer.pendingAmount += amount;
    customer.totalAmount += amount;
    if (customer.paymentStatus === 'Paid' || !customer.paymentStatus) {
      customer.paymentStatus = 'Pending';
    }
    await customer.save();

    res.status(201).json({
      success: true,
      data: paymentRequest
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Public Checkout for Self-Service QR
// @route   POST /api/v1/payments/public-checkout
// @access  Public
exports.publicCheckout = async (req, res, next) => {
  try {
    const { fullName, secondPersonName, contactNumber, email, amount, description, accountId } = req.body;

    if (!fullName || !contactNumber || !amount) {
      return res.status(400).json({ success: false, error: 'Name, Contact, and Amount are required' });
    }

    // 1. Find or Create Customer
    let customer = await Customer.findOne({ contactNumber });
    if (!customer) {
      customer = await Customer.create({
        fullName,
        secondPersonName,
        contactNumber,
        email,
        pendingAmount: 0,
        paidAmount: 0,
        paymentStatus: 'Pending'
      });
    } else {
      if (secondPersonName) customer.secondPersonName = secondPersonName;
    }

    // 2. Generate Razorpay Payment Link
    let paymentLinkData = { 
      short_url: `${process.env.FRONTEND_URL || 'http://localhost:5345'}/dummy-checkout`, 
      id: 'sim_pay_' + Date.now() 
    };
    
    if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('placeholder')) {
      const options = {
        amount: amount * 100, // paise
        currency: 'INR',
        accept_partial: false,
        description: description || 'Self-Service Payment',
        customer: {
          name: customer.fullName,
          contact: customer.contactNumber,
          email: customer.email || 'guest@example.com'
        },
        notify: { sms: true, email: true },
        reminder_enable: true,
        callback_url: process.env.FRONTEND_URL || 'http://localhost:5345',
        callback_method: 'get'
      };
      
      const response = await razorpayInstance.paymentLink.create(options);
      paymentLinkData = { short_url: response.short_url, id: response.id };
    }

    // 3. Update customer total liability
    const totalLiability = customer.secondPersonName ? 9500 : 4750;
    customer.totalAmount = totalLiability;
    customer.pendingAmount = Math.max(0, customer.totalAmount - customer.paidAmount);
    
    if (customer.pendingAmount > 0) {
      customer.paymentStatus = customer.paidAmount > 0 ? 'Partially Paid' : 'Pending';
    } else {
      customer.paymentStatus = 'Paid';
    }
    await customer.save();

    // 4. Create Payment Request Record
    const paymentData = {
      customer: customer._id,
      amount,
      description: description || 'Self-Service Checkout',
      paymentLink: paymentLinkData.short_url,
      razorpayOrderId: paymentLinkData.id,
      status: 'Pending',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    if (accountId && typeof accountId === 'string' && /^[0-9a-fA-F]{24}$/.test(accountId)) {
      paymentData.account = accountId;
    }

    const paymentRequest = await PaymentRequest.create(paymentData);

    // Append order ID to dummy link
    if (paymentLinkData.short_url.includes('dummy-checkout')) {
      paymentLinkData.short_url = `${paymentLinkData.short_url}?orderId=${paymentLinkData.id}&amount=${amount}`;
    }

    res.status(200).json({
      success: true,
      paymentLink: paymentLinkData.short_url
    });

  } catch (err) {
    console.error('Public Checkout Error:', err);
    res.status(500).json({ success: false, error: 'Failed to initiate checkout' });
  }
};

// @desc    Razorpay Webhook for payment confirmation
// @route   POST /api/v1/payments/webhook
// @access  Public
exports.razorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify Webhook Signature
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    // For local dev without real keys, bypass verification if simulated
    if (digest !== signature && process.env.NODE_ENV !== 'development') {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    const { event, payload } = req.body;

    if (event === 'payment_link.paid' || event === 'payment.captured') {
      const paymentEntity = payload.payment?.entity || payload.payment_link?.entity;
      const razorpayOrderId = payload.payment_link?.entity?.id || '';
      const amountPaid = paymentEntity.amount / 100; // Convert paise to INR

      // Find the payment request in our DB
      const paymentRequest = await PaymentRequest.findOne({ razorpayOrderId }).populate('customer');

      if (paymentRequest) {
        // Update Payment Request status
        paymentRequest.status = 'Paid';
        await paymentRequest.save();

        const customer = paymentRequest.customer;

        // Update Customer pending amount based on actual total
        customer.paidAmount += amountPaid;
        customer.pendingAmount = Math.max(0, customer.totalAmount - customer.paidAmount);
        
        if (customer.pendingAmount === 0) {
          customer.paymentStatus = 'Paid';
        } else {
          customer.paymentStatus = 'Partially Paid';
        }
        await customer.save();

        // Create a successful Transaction record
        await Transaction.create({
          paymentRequest: paymentRequest._id,
          customer: customer._id,
          account: paymentRequest.account,
          amount: amountPaid,
          paymentMethod: paymentEntity.method === 'upi' ? 'UPI' : 'Card',
          razorpayPaymentId: paymentEntity.id,
          status: 'Success'
        });

        // Update PaymentAccount if present
        if (paymentRequest.account) {
          const PaymentAccount = require('../models/PaymentAccount');
          await PaymentAccount.findByIdAndUpdate(paymentRequest.account, {
            $inc: { totalCollected: amountPaid }
          });
        }

        // Send Confirmations (Async)
        const messageText = `Thank you for your payment of ₹${amountPaid}. Your remaining pending amount is ₹${customer.pendingAmount}.`;

        if (customer.email) {
          sendEmail({
            customerId: customer._id,
            email: customer.email,
            subject: 'Payment Received - PaySmart',
            message: messageText
          });
        }

        if (customer.contactNumber) {
          // Send WhatsApp and SMS
          sendSMS({ customerId: customer._id, phone: customer.contactNumber, message: messageText, isWhatsApp: true });
          sendSMS({ customerId: customer._id, phone: customer.contactNumber, message: messageText, isWhatsApp: false });
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).json({ success: false });
  }
};

// @desc    Dummy Checkout Success Handler (For Demo Purposes)
// @route   POST /api/v1/payments/dummy-success
// @access  Public
exports.dummySuccess = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    
    const paymentRequest = await PaymentRequest.findOne({ razorpayOrderId: orderId }).populate('customer');
    
    if (!paymentRequest || paymentRequest.status === 'Paid') {
      return res.status(400).json({ success: false, error: 'Invalid or already paid request' });
    }

    const amountPaid = paymentRequest.amount;
    paymentRequest.status = 'Paid';
    await paymentRequest.save();

    const customer = paymentRequest.customer;
    customer.paidAmount += amountPaid;
    customer.pendingAmount = Math.max(0, customer.totalAmount - customer.paidAmount);
    customer.paymentStatus = customer.pendingAmount === 0 ? 'Paid' : 'Partially Paid';
    await customer.save();

    await Transaction.create({
      paymentRequest: paymentRequest._id,
      customer: customer._id,
      account: paymentRequest.account,
      amount: amountPaid,
      paymentMethod: 'UPI',
      razorpayPaymentId: 'pay_dummy_' + Date.now(),
      status: 'Success'
    });

    if (paymentRequest.account) {
      const PaymentAccount = require('../models/PaymentAccount');
      await PaymentAccount.findByIdAndUpdate(paymentRequest.account, {
        $inc: { totalCollected: amountPaid }
      });
    }

    res.status(200).json({ success: true, message: 'Dummy payment successful' });
  } catch (err) {
    console.error('Dummy Success Error:', err);
    res.status(500).json({ success: false });
  }
};
