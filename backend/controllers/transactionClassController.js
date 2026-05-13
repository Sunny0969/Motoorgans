const TransactionClass = require('../models/TransactionClass');

// Get all transaction classes with optional filtering
const getAllTransactionClasses = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    let query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { className: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    const transactionClasses = await TransactionClass.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactionClasses.length,
      data: transactionClasses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction classes',
      error: error.message
    });
  }
};

// Get single transaction class by ID
const getTransactionClassById = async (req, res) => {
  try {
    const transactionClass = await TransactionClass.findById(req.params.id);

    if (!transactionClass) {
      return res.status(404).json({
        success: false,
        message: 'Transaction class not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transactionClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction class',
      error: error.message
    });
  }
};

// Create new transaction class
const createTransactionClass = async (req, res) => {
  try {
    const { className, code, description, category, status } = req.body;

    // Check if code already exists
    const existingClass = await TransactionClass.findOne({ code: code.toUpperCase() });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Transaction class code already exists'
      });
    }

    const transactionClass = await TransactionClass.create({
      className,
      code: code.toUpperCase(),
      description,
      category,
      status
    });

    res.status(201).json({
      success: true,
      message: 'Transaction class created successfully',
      data: transactionClass
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        error: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating transaction class',
      error: error.message
    });
  }
};

// Update transaction class
const updateTransactionClass = async (req, res) => {
  try {
    const { className, code, description, category, status } = req.body;

    // Check if code already exists (excluding current record)
    if (code) {
      const existingClass = await TransactionClass.findOne({
        code: code.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingClass) {
        return res.status(400).json({
          success: false,
          message: 'Transaction class code already exists'
        });
      }
    }

    const transactionClass = await TransactionClass.findByIdAndUpdate(
      req.params.id,
      {
        className,
        code: code ? code.toUpperCase() : undefined,
        description,
        category,
        status
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!transactionClass) {
      return res.status(404).json({
        success: false,
        message: 'Transaction class not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction class updated successfully',
      data: transactionClass
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        error: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating transaction class',
      error: error.message
    });
  }
};

// Delete transaction class
const deleteTransactionClass = async (req, res) => {
  try {
    const transactionClass = await TransactionClass.findByIdAndDelete(req.params.id);

    if (!transactionClass) {
      return res.status(404).json({
        success: false,
        message: 'Transaction class not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction class deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting transaction class',
      error: error.message
    });
  }
};

// Get transaction classes by category
const getTransactionClassesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const transactionClasses = await TransactionClass.find({
      category,
      status: 'Active'
    }).sort({ className: 1 });

    res.status(200).json({
      success: true,
      count: transactionClasses.length,
      data: transactionClasses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction classes by category',
      error: error.message
    });
  }
};

module.exports = {
  getAllTransactionClasses,
  getTransactionClassById,
  createTransactionClass,
  updateTransactionClass,
  deleteTransactionClass,
  getTransactionClassesByCategory
};
