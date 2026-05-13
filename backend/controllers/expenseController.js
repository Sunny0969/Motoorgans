const Expense = require('../models/Expense');

// Get all expenses with optional filtering
const getAllExpenses = async (req, res) => {
  try {
    const {
      dateFrom,
      dateTo,
      category,
      paymentMethod,
      status,
      page = 1,
      limit = 50
    } = req.query;

    let filter = {};

    // Date range filter
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    // Other filters
    if (category && category !== '') filter.category = category;
    if (paymentMethod && paymentMethod !== '') filter.paymentMethod = paymentMethod;
    if (status && status !== 'all') filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const expenses = await Expense.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(filter);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses',
      error: error.message
    });
  }
};

// Get expense by ID
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense',
      error: error.message
    });
  }
};

// Create new expense
const createExpense = async (req, res) => {
  try {
    const {
      date,
      description,
      category,
      amount,
      paymentMethod,
      vendor,
      taxAmount,
      notes
    } = req.body;

    // Generate expense ID
    const lastExpense = await Expense.findOne().sort({ createdAt: -1 });
    const nextId = lastExpense ? parseInt(lastExpense.expenseId.split('-')[1]) + 1 : 1;
    const expenseId = `EXP-${String(nextId).padStart(3, '0')}`;

    // Generate receipt number
    const receiptNo = `RCP-${String(nextId).padStart(3, '0')}`;

    const expense = new Expense({
      expenseId,
      date: new Date(date),
      description,
      category,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || 'Cash',
      vendor: vendor || '',
      taxAmount: parseFloat(taxAmount) || 0,
      notes: notes || '',
      receiptNo
    });

    const savedExpense = await expense.save();

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: savedExpense
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Expense ID already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating expense',
      error: error.message
    });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    const {
      date,
      description,
      category,
      amount,
      paymentMethod,
      vendor,
      taxAmount,
      notes
    } = req.body;

    const updateData = {
      date: date ? new Date(date) : undefined,
      description,
      category,
      amount: amount ? parseFloat(amount) : undefined,
      paymentMethod,
      vendor,
      taxAmount: taxAmount ? parseFloat(taxAmount) : undefined,
      notes
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating expense',
      error: error.message
    });
  }
};

// Approve expense
const approveExpense = async (req, res) => {
  try {
    const { approvedBy } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: approvedBy || 'System Admin'
      },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense approved successfully',
      data: expense
    });
  } catch (error) {
    console.error('Error approving expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving expense',
      error: error.message
    });
  }
};

// Reject expense
const rejectExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense rejected successfully',
      data: expense
    });
  } catch (error) {
    console.error('Error rejecting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting expense',
      error: error.message
    });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting expense',
      error: error.message
    });
  }
};

// Get expense statistics
const getExpenseStats = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.date = {};
      if (dateFrom) dateFilter.date.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.date.$lte = new Date(dateTo);
    }

    const [
      totalExpenses,
      approvedExpenses,
      pendingExpenses,
      rejectedExpenses,
      categoryStats,
      paymentMethodStats
    ] = await Promise.all([
      Expense.countDocuments(dateFilter),
      Expense.find({ ...dateFilter, status: 'approved' }).select('totalAmount'),
      Expense.find({ ...dateFilter, status: 'pending' }).select('totalAmount'),
      Expense.find({ ...dateFilter, status: 'rejected' }).select('totalAmount'),
      Expense.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$category', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Expense.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$paymentMethod', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ])
    ]);

    const calculateTotal = (expenses) => expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalCount: totalExpenses,
          approvedCount: approvedExpenses.length,
          pendingCount: pendingExpenses.length,
          rejectedCount: rejectedExpenses.length,
          totalAmount: calculateTotal(approvedExpenses) + calculateTotal(pendingExpenses) + calculateTotal(rejectedExpenses),
          approvedAmount: calculateTotal(approvedExpenses),
          pendingAmount: calculateTotal(pendingExpenses),
          rejectedAmount: calculateTotal(rejectedExpenses)
        },
        categoryBreakdown: categoryStats,
        paymentMethodBreakdown: paymentMethodStats
      }
    });
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  approveExpense,
  rejectExpense,
  deleteExpense,
  getExpenseStats
};
