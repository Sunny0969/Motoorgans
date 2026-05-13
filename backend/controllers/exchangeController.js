const Exchange = require('../models/Exchange');

// Get all exchanges
const getAllExchanges = async (req, res) => {
  try {
    const exchanges = await Exchange.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: exchanges
    });
  } catch (error) {
    console.error('Error fetching exchanges:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exchanges',
      error: error.message
    });
  }
};

// Get exchange by ID
const getExchangeById = async (req, res) => {
  try {
    const exchange = await Exchange.findById(req.params.id);
    if (!exchange) {
      return res.status(404).json({
        success: false,
        message: 'Exchange not found'
      });
    }
    res.status(200).json({
      success: true,
      data: exchange
    });
  } catch (error) {
    console.error('Error fetching exchange:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exchange',
      error: error.message
    });
  }
};

// Create new exchange
const createExchange = async (req, res) => {
  try {
    const exchangeData = req.body;

    // Calculate totals
    const totalReturnItems = exchangeData.returnItems?.length || 0;
    const totalNewItems = exchangeData.newItems?.length || 0;

    const totalReturnValue = exchangeData.returnItems?.reduce((sum, item) => sum + (parseFloat(item.returnAmount) || 0), 0) || 0;
    const totalNewValue = exchangeData.newItems?.reduce((sum, item) => sum + (parseFloat(item.netAmount) || 0), 0) || 0;
    const balanceAmount = totalReturnValue - totalNewValue;

    const newExchange = new Exchange({
      ...exchangeData,
      totalReturnItems,
      totalNewItems,
      totalReturnValue,
      totalNewValue,
      balanceAmount,
      refundAmount: balanceAmount > 0 ? balanceAmount : 0,
      exchangeValue: totalNewValue
    });

    const savedExchange = await newExchange.save();

    res.status(201).json({
      success: true,
      message: 'Exchange created successfully',
      data: savedExchange
    });
  } catch (error) {
    console.error('Error creating exchange:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Exchange number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating exchange',
      error: error.message
    });
  }
};

// Update exchange
const updateExchange = async (req, res) => {
  try {
    const exchangeData = req.body;

    // Calculate totals
    const totalReturnItems = exchangeData.returnItems?.length || 0;
    const totalNewItems = exchangeData.newItems?.length || 0;

    const totalReturnValue = exchangeData.returnItems?.reduce((sum, item) => sum + (parseFloat(item.returnAmount) || 0), 0) || 0;
    const totalNewValue = exchangeData.newItems?.reduce((sum, item) => sum + (parseFloat(item.netAmount) || 0), 0) || 0;
    const balanceAmount = totalReturnValue - totalNewValue;

    const updatedExchange = await Exchange.findByIdAndUpdate(
      req.params.id,
      {
        ...exchangeData,
        totalReturnItems,
        totalNewItems,
        totalReturnValue,
        totalNewValue,
        balanceAmount,
        refundAmount: balanceAmount > 0 ? balanceAmount : 0,
        exchangeValue: totalNewValue
      },
      { new: true, runValidators: true }
    );

    if (!updatedExchange) {
      return res.status(404).json({
        success: false,
        message: 'Exchange not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Exchange updated successfully',
      data: updatedExchange
    });
  } catch (error) {
    console.error('Error updating exchange:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Exchange number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating exchange',
      error: error.message
    });
  }
};

// Delete exchange
const deleteExchange = async (req, res) => {
  try {
    const deletedExchange = await Exchange.findByIdAndDelete(req.params.id);
    if (!deletedExchange) {
      return res.status(404).json({
        success: false,
        message: 'Exchange not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Exchange deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting exchange:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting exchange',
      error: error.message
    });
  }
};

// Get exchanges by status
const getExchangesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const exchanges = await Exchange.find({ status }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: exchanges
    });
  } catch (error) {
    console.error('Error fetching exchanges by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exchanges by status',
      error: error.message
    });
  }
};

// Get exchanges by customer
const getExchangesByCustomer = async (req, res) => {
  try {
    const { customer } = req.params;
    const exchanges = await Exchange.find({
      customer: new RegExp(customer, 'i')
    }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: exchanges
    });
  } catch (error) {
    console.error('Error fetching exchanges by customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exchanges by customer',
      error: error.message
    });
  }
};

// Get exchange statistics
const getExchangeStatistics = async (req, res) => {
  try {
    const stats = await Exchange.aggregate([
      {
        $group: {
          _id: null,
          totalExchanges: { $sum: 1 },
          pendingExchanges: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          },
          processingExchanges: {
            $sum: { $cond: [{ $eq: ['$status', 'Processing'] }, 1, 0] }
          },
          completedExchanges: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          totalReturnValue: { $sum: '$totalReturnValue' },
          totalExchangeValue: { $sum: '$totalNewValue' },
          totalRefundAmount: { $sum: '$refundAmount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalExchanges: 0,
      pendingExchanges: 0,
      processingExchanges: 0,
      completedExchanges: 0,
      totalReturnValue: 0,
      totalExchangeValue: 0,
      totalRefundAmount: 0
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching exchange statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exchange statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllExchanges,
  getExchangeById,
  createExchange,
  updateExchange,
  deleteExchange,
  getExchangesByStatus,
  getExchangesByCustomer,
  getExchangeStatistics
};
