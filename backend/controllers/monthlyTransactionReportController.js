const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Product = require('../models/Product');

// @desc    Get monthly transaction report
// @route   GET /api/monthly-transaction-reports
// @access  Public
const getMonthlyTransactionReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get sales data
    const sales = await Sale.find({
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['Confirmed', 'Draft'] }
    }).populate('customer', 'name code')
      .populate('products.product', 'name category');

    // Get expenses data
    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate },
      status: 'approved'
    });

    // Get purchases data
    const purchases = await Purchase.find({
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['Confirmed', 'Draft'] }
    }).populate('supplier', 'name code')
      .populate('products.product', 'name category');

    // Calculate summary metrics
    const totalSales = sales.reduce((sum, sale) => sum + sale.netAmount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
    const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.netAmount, 0);
    const netProfit = totalSales - totalExpenses;
    const transactionCount = sales.length + purchases.length;

    // Calculate average transaction value
    const averageTransaction = transactionCount > 0 ? totalSales / transactionCount : 0;

    // Calculate refunds (assuming negative sales are refunds)
    const refunds = sales
      .filter(sale => sale.netAmount < 0)
      .reduce((sum, sale) => sum + Math.abs(sale.netAmount), 0);

    // Generate daily breakdown
    const dailyBreakdown = [];
    for (let day = 1; day <= endDate.getDate(); day++) {
      const dayStart = new Date(year, month - 1, day);
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

      const daySales = sales.filter(sale =>
        sale.date >= dayStart && sale.date <= dayEnd
      ).reduce((sum, sale) => sum + sale.netAmount, 0);

      const dayExpenses = expenses.filter(expense =>
        expense.date >= dayStart && expense.date <= dayEnd
      ).reduce((sum, expense) => sum + expense.totalAmount, 0);

      const dayTransactions = sales.filter(sale =>
        sale.date >= dayStart && sale.date <= dayEnd
      ).length;

      if (daySales > 0 || dayExpenses > 0 || dayTransactions > 0) {
        dailyBreakdown.push({
          date: dayStart.toISOString().split('T')[0],
          sales: daySales,
          transactions: dayTransactions,
          expenses: dayExpenses
        });
      }
    }

    // Generate category breakdown from sales
    const categoryMap = new Map();

    sales.forEach(sale => {
      sale.products.forEach(product => {
        const category = product.product?.category || 'Uncategorized';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { amount: 0, count: 0 });
        }
        categoryMap.get(category).amount += product.net;
        categoryMap.get(category).count += product.pcs;
      });
    });

    const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      amount: data.amount,
      percentage: totalSales > 0 ? (data.amount / totalSales * 100).toFixed(1) : 0
    })).sort((a, b) => b.amount - a.amount);

    // Generate payment methods breakdown
    const paymentMethods = [
      { method: 'Cash', amount: 0, percentage: 0 },
      { method: 'Credit Card', amount: 0, percentage: 0 },
      { method: 'Digital Wallet', amount: 0, percentage: 0 },
      { method: 'Bank Transfer', amount: 0, percentage: 0 }
    ];

    // For now, distribute sales across payment methods (in real app, this would come from payment data)
    const cashSales = sales.filter(sale => sale.paymentType === 'Cash').reduce((sum, sale) => sum + sale.netAmount, 0);
    const creditSales = sales.filter(sale => sale.paymentType === 'Credit').reduce((sum, sale) => sum + sale.netAmount, 0);

    paymentMethods[0].amount = cashSales;
    paymentMethods[1].amount = creditSales * 0.6; // Assuming 60% credit card
    paymentMethods[2].amount = creditSales * 0.3; // Assuming 30% digital wallet
    paymentMethods[3].amount = creditSales * 0.1; // Assuming 10% bank transfer

    paymentMethods.forEach(method => {
      method.percentage = totalSales > 0 ? (method.amount / totalSales * 100).toFixed(1) : 0;
    });

    const reportData = {
      summary: {
        totalSales,
        totalExpenses,
        netProfit,
        transactionCount,
        averageTransaction,
        refunds
      },
      dailyBreakdown,
      categories,
      paymentMethods: paymentMethods.filter(method => method.amount > 0)
    };

    res.json(reportData);
  } catch (error) {
    console.error('Error generating monthly transaction report:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed transaction list
// @route   GET /api/monthly-transaction-reports/detailed
// @access  Public
const getDetailedTransactionList = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 50, category, search } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const skip = (page - 1) * limit;

    // Build filter for sales
    let saleFilter = {
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['Confirmed', 'Draft'] }
    };

    if (search) {
      saleFilter.$or = [
        { invoiceNo: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    // Get sales with pagination
    const sales = await Sale.find(saleFilter)
      .populate('customer', 'name code')
      .populate('products.product', 'name category')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalSales = await Sale.countDocuments(saleFilter);

    // Transform sales data
    const transactions = sales.map(sale => ({
      id: sale._id,
      date: sale.date.toISOString().split('T')[0] + ' ' + sale.date.toTimeString().split(' ')[0],
      transactionId: sale.invoiceNo,
      customer: sale.customerName || (sale.customer ? sale.customer.name : 'Walk-in'),
      category: sale.products[0]?.product?.category || 'General',
      items: sale.products.reduce((sum, p) => sum + p.pcs, 0),
      paymentMethod: sale.paymentType === 'Cash' ? 'Cash' : 'Credit Card',
      amount: sale.netAmount,
      status: sale.status === 'Confirmed' ? 'Completed' : 'Pending'
    }));

    res.json({
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalSales / limit),
        totalTransactions: totalSales,
        hasNext: page * limit < totalSales,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting detailed transaction list:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export monthly transaction report
// @route   GET /api/monthly-transaction-reports/export
// @access  Public
const exportMonthlyTransactionReport = async (req, res) => {
  try {
    const { month, year, format = 'pdf' } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Get the report data
    const reportData = await getMonthlyTransactionReportData(month, year);

    // In a real implementation, you would generate PDF/Excel here
    // For now, return JSON data that can be used for export
    res.json({
      success: true,
      message: `Report for ${month}/${year} prepared for ${format.toUpperCase()} export`,
      data: reportData,
      exportUrl: `/api/monthly-transaction-reports/download/${year}-${month}.${format}`
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get report data
const getMonthlyTransactionReportData = async (month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const sales = await Sale.find({
    date: { $gte: startDate, $lte: endDate },
    status: { $in: ['Confirmed', 'Draft'] }
  });

  const expenses = await Expense.find({
    date: { $gte: startDate, $lte: endDate },
    status: 'approved'
  });

  const totalSales = sales.reduce((sum, sale) => sum + sale.netAmount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);

  return {
    period: `${month}/${year}`,
    totalSales,
    totalExpenses,
    netProfit: totalSales - totalExpenses,
    transactionCount: sales.length
  };
};

module.exports = {
  getMonthlyTransactionReport,
  getDetailedTransactionList,
  exportMonthlyTransactionReport
};
