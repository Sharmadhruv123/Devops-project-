const express = require('express');
const {
  getPaymentRequests,
  createPaymentRequest,
  razorpayWebhook,
  publicCheckout,
  dummySuccess
} = require('../controllers/paymentController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/webhook', razorpayWebhook);
router.post('/public-checkout', publicCheckout);
router.post('/dummy-success', dummySuccess);

// All other routes are protected
router.use(protect);

router
  .route('/')
  .get(getPaymentRequests)
  .post(createPaymentRequest);

module.exports = router;
