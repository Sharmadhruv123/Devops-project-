const ErrorResponse = require('../utils/errorHandler');
const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/v1/customers
// @access  Private
exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find().sort('-createdAt');
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single customer
// @route   GET /api/v1/customers/:id
// @access  Private
exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return next(new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new customer
// @route   POST /api/v1/customers
// @access  Private
exports.createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update customer
// @route   PUT /api/v1/customers/:id
// @access  Private
exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!customer) {
      return next(new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete customer
// @route   DELETE /api/v1/customers/:id
// @access  Private
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return next(new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
