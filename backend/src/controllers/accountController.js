const PaymentAccount = require('../models/PaymentAccount');

// @desc    Get all payment accounts
// @route   GET /api/v1/accounts
// @access  Private
exports.getAccounts = async (req, res, next) => {
  try {
    const accounts = await PaymentAccount.find().sort('-createdAt');
    res.status(200).json({ success: true, data: accounts });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new payment account
// @route   POST /api/v1/accounts
// @access  Private
exports.createAccount = async (req, res, next) => {
  try {
    const account = await PaymentAccount.create(req.body);
    res.status(201).json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle account status (Active/Inactive)
// @route   PUT /api/v1/accounts/:id/toggle
// @access  Private
exports.toggleAccountStatus = async (req, res, next) => {
  try {
    let account = await PaymentAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    
    account.isActive = !account.isActive;
    await account.save();

    res.status(200).json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
};
