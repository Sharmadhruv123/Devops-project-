const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./utils/connectDB');
const initCronJobs = require('./utils/cronJobs');
const { errorHandler } = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize Cron Jobs
initCronJobs();

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Mount routers
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/customers', require('./routes/customerRoutes'));
app.use('/api/v1/payments', require('./routes/paymentRoutes'));
app.use('/api/v1/analytics', require('./routes/analyticsRoutes'));
app.use('/api/v1/accounts', require('./routes/accountRoutes'));

// Basic route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
