const Customer = require('../models/Customer');
const PaymentRequest = require('../models/PaymentRequest');
const Transaction = require('../models/Transaction');
const PaymentAccount = require('../models/PaymentAccount');

// @desc    Get dashboard analytics data
// @route   GET /api/v1/analytics
// @access  Private
exports.getAnalytics = async (req, res, next) => {
  try {
    // 1. Core KPIs
    const customers = await Customer.find();
    const payments = await PaymentRequest.find();
    
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const totalPending = customers.reduce((acc, curr) => acc + curr.pendingAmount, 0);
    const paidRequests = payments.filter(p => p.status === 'Paid').length;

    // 2. Revenue chart data (Last 7 days mock or real logic)
    // For simplicity, we'll aggregate Transactions by day
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTransactions = await Transaction.find({
      date: { $gte: sevenDaysAgo },
      status: 'Success'
    }).sort('date');

    const recentPaymentsList = await Transaction.find()
      .populate('customer', 'fullName contactNumber')
      .sort('-date')
      .limit(5);

    // Grouping by day logic (simple version)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartDataMap = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      chartDataMap[dayName] = { name: dayName, revenue: 0, pending: 0 };
    }

    // Populate revenue
    recentTransactions.forEach(t => {
      const dayName = days[new Date(t.date).getDay()];
      if (chartDataMap[dayName]) {
        chartDataMap[dayName].revenue += t.amount;
      }
    });

    // Populate pending (mock distributed)
    const chartData = Object.values(chartDataMap);

    // 3. Account-wise Collections
    const accounts = await PaymentAccount.find();
    const accountAnalytics = accounts.map(acc => ({
      accountId: acc._id,
      name: acc.accountName,
      provider: acc.provider,
      isActive: acc.isActive,
      totalCollected: acc.totalCollected
    }));

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalPending,
        totalCustomers,
        paidRequests,
        chartData,
        accountAnalytics,
        recentTransactions: recentPaymentsList.map(t => ({
          id: t._id,
          customerName: t.customer?.fullName || 'Unknown',
          method: t.paymentMethod,
          amount: t.amount,
          status: t.status,
          date: t.date
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};
