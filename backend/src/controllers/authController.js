const ErrorResponse = require('../utils/errorHandler');
const Admin = require('../models/Admin');

// @desc    Register admin
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password,
      role
    });

    sendTokenResponse(admin, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login admin
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for admin
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(admin, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in admin
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // req.admin is set in protect middleware
    const admin = await Admin.findById(req.admin.id);

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (err) {
    next(err);
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (admin, statusCode, res) => {
  // Create token
  const token = admin.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_EXPIRE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};
