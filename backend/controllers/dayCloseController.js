const DayClose = require('../models/DayClose');
const Sale = require('../models/Sale');
const CashPayment = require('../models/CashPayment');
const CashReceipt = require('../models/CashReceipt');
const BankPayment = require('../models/BankPayment');
const BankReceipt = require('../models/BankReceipt');
const Employee = require('../models/Employee');

// @desc    Get all day close records
// @route   GET /api/day-close
// @access  Public
const getDayCloses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.cashier) filter.cashier = req.query.cashier;
    if (req.query.startDate && req.query.endDate) {
      filter.closeDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const dayCloses = await DayClose.find(filter)
      .populate('cashier', 'name code')
      .populate('verification.cashier.verifiedBy', 'name')
      .populate('verification.manager.verifiedBy', 'name')
      .sort({ closeDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DayClose.countDocuments(filter);

    res.json({
      success: true,
      data: dayCloses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single day close record
// @route   GET /api/day-close/:id
// @access  Public
const getDayClose = async (req, res) => {
  try {
    const dayClose = await DayClose.findById(req.params.id)
      .populate('cashier', 'name code')
      .populate('verification.cashier.verifiedBy', 'name')
      .populate('verification.manager.verifiedBy', 'name');

    if (!dayClose) {
      return res.status(404).json({
        success: false,
        message: 'Day close record not found'
      });
    }

    res.json({
      success: true,
      data: dayClose
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get day close by date and shift
// @route   GET /api/day-close/by-date/:date/:shift
// @access  Public
const getDayCloseByDate = async (req, res) => {
  try {
    const { date, shift } = req.params;
    const closeDate = new Date(date);

    const dayClose = await DayClose.findOne({ closeDate, shift })
      .populate('cashier', 'name code')
      .populate('verification.cashier.verifiedBy', 'name')
      .populate('verification.manager.verifiedBy', 'name');

    if (!dayClose) {
      return res.status(404).json({
        success: false,
        message: 'Day close record not found for this date and shift'
      });
    }

    res.json({
      success: true,
      data: dayClose
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Generate day close data
// @route   POST /api/day-close/generate
// @access  Public
const generateDayClose = async (req, res) => {
  try {
    const { closeDate, shift, cashier, openingBalance, actualBalance } = req.body;

    // Validate required fields
    if (!closeDate || !shift || !cashier || openingBalance === undefined || actualBalance === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if day close already exists for this date and shift
    const existingClose = await DayClose.findOne({ closeDate: new Date(closeDate), shift });
    if (existingClose) {
      return res.status(400).json({
        success: false,
        message: 'Day close already exists for this date and shift'
      });
    }

    // Validate cashier exists
    const cashierExists = await Employee.findById(cashier);
    if (!cashierExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cashier'
      });
    }

    // Calculate sales data for the day/shift
    const startOfDay = new Date(closeDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(closeDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get sales data
    const sales = await Sale.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      shift: shift
    });

    // Calculate sales summary
    let totalSales = 0;
    let cashSales = 0;
    let cardSales = 0;
    let digitalSales = 0;
    let totalTransactions = sales.length;
    let totalDiscounts = 0;

    sales.forEach(sale => {
      totalSales += sale.total || 0;
      if (sale.paymentMethod === 'cash') cashSales += sale.total || 0;
      else if (sale.paymentMethod === 'card') cardSales += sale.total || 0;
      else if (sale.paymentMethod === 'digital') digitalSales += sale.total || 0;
      totalDiscounts += sale.discount || 0;
    });

    // Get payment data
    const cashPayments = await CashPayment.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      shift: shift
    });

    const cashReceipts = await CashReceipt.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      shift: shift
    });

    const bankPayments = await BankPayment.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      shift: shift
    });

    const bankReceipts = await BankReceipt.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      shift: shift
    });

    // Calculate cash expenses (payments - receipts)
    const totalCashPayments = cashPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalCashReceipts = cashReceipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0);
    const cashExpenses = totalCashPayments - totalCashReceipts;

    // Calculate expected balance
    const expectedBalance = openingBalance + cashSales - cashExpenses;

    // Create day close record
    const dayClose = new DayClose({
      closeDate: new Date(closeDate),
      shift,
      cashier,
      cashierDetails: {
        name: cashierExists.name,
        code: cashierExists.code
      },
      openingTime: shift === 'morning' ? '09:00' : shift === 'evening' ? '15:00' : '21:00',
      closingTime: shift === 'morning' ? '15:00' : shift === 'evening' ? '21:00' : '05:00',

      sales: {
        totalSales,
        cashSales,
        cardSales,
        digitalSales,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0
      },

      cashReconciliation: {
        openingBalance,
        sales: cashSales,
        expenses: cashExpenses,
        expectedBalance,
        actualBalance,
        difference: actualBalance - expectedBalance
      },

      payments: {
        cash: {
          total: cashSales,
          transactions: sales.filter(s => s.paymentMethod === 'cash').length
        },
        card: {
          total: cardSales,
          transactions: sales.filter(s => s.paymentMethod === 'card').length
        },
        digital: {
          total: digitalSales,
          transactions: sales.filter(s => s.paymentMethod === 'digital').length
        }
      },

      transactions: {
        sales: totalTransactions,
        returns: 0, // TODO: Implement returns tracking
        voids: 0,  // TODO: Implement voids tracking
        discounts: totalDiscounts
      },

      expenses: {
        total: cashExpenses,
        cashExpenses: cashExpenses,
        nonCashExpenses: 0, // TODO: Implement non-cash expenses
        categories: [] // TODO: Implement expense categories
      },

      status: 'closing'
    });

    const savedDayClose = await dayClose.save();
    await savedDayClose.populate('cashier', 'name code');

    res.status(201).json({
      success: true,
      data: savedDayClose,
      message: 'Day close data generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update day close record
// @route   PUT /api/day-close/:id
// @access  Public
const updateDayClose = async (req, res) => {
  try {
    const dayClose = await DayClose.findById(req.params.id);

    if (!dayClose) {
      return res.status(404).json({
        success: false,
        message: 'Day close record not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'closingTime', 'sales', 'cashReconciliation', 'payments',
      'transactions', 'expenses', 'notes'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        dayClose[field] = req.body[field];
      }
    });

    const updatedDayClose = await dayClose.save();
    await updatedDayClose.populate('cashier', 'name code');

    res.json({
      success: true,
      data: updatedDayClose,
      message: 'Day close record updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Verify day close (cashier verification)
// @route   POST /api/day-close/:id/verify/cashier
// @access  Public
const verifyCashier = async (req, res) => {
  try {
    const { verifiedBy } = req.body;

    const dayClose = await DayClose.findById(req.params.id);

    if (!dayClose) {
      return res.status(404).json({
        success: false,
        message: 'Day close record not found'
      });
    }

    // Validate verifier exists
    const verifier = await Employee.findById(verifiedBy);
    if (!verifier) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verifier'
      });
    }

    dayClose.verification.cashier = {
      verified: true,
      verifiedAt: new Date(),
      verifiedBy: verifiedBy
    };

    await dayClose.save();

    res.json({
      success: true,
      message: 'Cashier verification completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Verify day close (manager verification)
// @route   POST /api/day-close/:id/verify/manager
// @access  Public
const verifyManager = async (req, res) => {
  try {
    const { verifiedBy } = req.body;

    const dayClose = await DayClose.findById(req.params.id);

    if (!dayClose) {
      return res.status(404).json({
        success: false,
        message: 'Day close record not found'
      });
    }

    // Validate verifier exists
    const verifier = await Employee.findById(verifiedBy);
    if (!verifier) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verifier'
      });
    }

    dayClose.verification.manager = {
      verified: true,
      verifiedAt: new Date(),
      verifiedBy: verifiedBy
    };

    // If both verifications are complete, mark as closed
    if (dayClose.verification.cashier.verified) {
      dayClose.status = 'closed';
      dayClose.zReport = {
        reportNumber: `Z-${Date.now()}`,
        generatedAt: new Date(),
        printedAt: new Date()
      };
    }

    await dayClose.save();

    res.json({
      success: true,
      message: 'Manager verification completed successfully',
      data: dayClose
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Reopen day close
// @route   POST /api/day-close/:id/reopen
// @access  Public
const reopenDayClose = async (req, res) => {
  try {
    const { reason, reopenedBy } = req.body;

    const dayClose = await DayClose.findById(req.params.id);

    if (!dayClose) {
      return res.status(404).json({
        success: false,
        message: 'Day close record not found'
      });
    }

    if (dayClose.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Day close is not closed'
      });
    }

    dayClose.status = 'reopened';
    dayClose.notes = `${dayClose.notes || ''}\nReopened on ${new Date().toISOString()} by ${reopenedBy}: ${reason}`.trim();

    await dayClose.save();

    res.json({
      success: true,
      message: 'Day close reopened successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get day close summary for date range
// @route   GET /api/day-close/summary
// @access  Public
const getDayCloseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { status: 'closed' };
    if (startDate && endDate) {
      filter.closeDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const dayCloses = await DayClose.find(filter);

    const summary = dayCloses.reduce((acc, dayClose) => {
      acc.totalDays += 1;
      acc.totalSales += dayClose.sales.totalSales;
      acc.totalCashSales += dayClose.sales.cashSales;
      acc.totalCardSales += dayClose.sales.cardSales;
      acc.totalDigitalSales += dayClose.sales.digitalSales;
      acc.totalTransactions += dayClose.sales.totalTransactions;
      acc.totalExpenses += dayClose.expenses.total;
      acc.totalCashDifferences += Math.abs(dayClose.cashReconciliation.difference);
      return acc;
    }, {
      totalDays: 0,
      totalSales: 0,
      totalCashSales: 0,
      totalCardSales: 0,
      totalDigitalSales: 0,
      totalTransactions: 0,
      totalExpenses: 0,
      totalCashDifferences: 0
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getDayCloses,
  getDayClose,
  getDayCloseByDate,
  generateDayClose,
  updateDayClose,
  verifyCashier,
  verifyManager,
  reopenDayClose,
  getDayCloseSummary
};
