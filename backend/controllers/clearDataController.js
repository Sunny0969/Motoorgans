const ClearDataHistory = require('../models/ClearDataHistory');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Voucher = require('../models/Voucher');
const CashPayment = require('../models/CashPayment');
const CashReceipt = require('../models/CashReceipt');
const BankPayment = require('../models/BankPayment');
const BankReceipt = require('../models/BankReceipt');
const ChequeTransfer = require('../models/ChequeTransfer');
const ClaimInFromCustomer = require('../models/ClaimInFromCustomer');
const ClaimOutToSupplier = require('../models/ClaimOutToSupplier');

// Get clear data history
const getClearHistory = async (req, res) => {
  try {
    const history = await ClearDataHistory.find()
      .sort({ timestamp: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching clear data history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clear data history',
      error: error.message
    });
  }
};

// Clear sales data
const clearSalesData = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const result = await Sale.deleteMany(query);

    // Log the action
    await ClearDataHistory.create({
      action: 'sales',
      actionLabel: 'Sales Records',
      dateRange: {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      recordsAffected: result.deletedCount,
      details: `Cleared ${result.deletedCount} sales records`
    });

    res.status(200).json({
      success: true,
      message: `Successfully cleared ${result.deletedCount} sales records`,
      recordsAffected: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing sales data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear sales data',
      error: error.message
    });
  }
};

// Clear product data
const clearProductData = async (req, res) => {
  try {
    const result = await Product.deleteMany({});

    // Log the action
    await ClearDataHistory.create({
      action: 'products',
      actionLabel: 'Product Data',
      recordsAffected: result.deletedCount,
      details: `Cleared ${result.deletedCount} products`
    });

    res.status(200).json({
      success: true,
      message: `Successfully cleared ${result.deletedCount} products`,
      recordsAffected: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing product data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear product data',
      error: error.message
    });
  }
};

// Clear customer data
const clearCustomerData = async (req, res) => {
  try {
    const result = await Customer.deleteMany({});

    // Log the action
    await ClearDataHistory.create({
      action: 'customers',
      actionLabel: 'Customer Data',
      recordsAffected: result.deletedCount,
      details: `Cleared ${result.deletedCount} customers`
    });

    res.status(200).json({
      success: true,
      message: `Successfully cleared ${result.deletedCount} customers`,
      recordsAffected: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing customer data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear customer data',
      error: error.message
    });
  }
};

// Clear transaction logs
const clearTransactionLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    let query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Clear various transaction types
    const cashPaymentResult = await CashPayment.deleteMany(query);
    const cashReceiptResult = await CashReceipt.deleteMany(query);
    const bankPaymentResult = await BankPayment.deleteMany(query);
    const bankReceiptResult = await BankReceipt.deleteMany(query);
    const chequeTransferResult = await ChequeTransfer.deleteMany(query);
    const claimInResult = await ClaimInFromCustomer.deleteMany(query);
    const claimOutResult = await ClaimOutToSupplier.deleteMany(query);

    const totalRecords = cashPaymentResult.deletedCount +
                        cashReceiptResult.deletedCount +
                        bankPaymentResult.deletedCount +
                        bankReceiptResult.deletedCount +
                        chequeTransferResult.deletedCount +
                        claimInResult.deletedCount +
                        claimOutResult.deletedCount;

    // Log the action
    await ClearDataHistory.create({
      action: 'transactions',
      actionLabel: 'Transaction Logs',
      dateRange: {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      recordsAffected: totalRecords,
      details: `Cleared ${totalRecords} transaction records`
    });

    res.status(200).json({
      success: true,
      message: `Successfully cleared ${totalRecords} transaction records`,
      recordsAffected: totalRecords
    });
  } catch (error) {
    console.error('Error clearing transaction logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear transaction logs',
      error: error.message
    });
  }
};

// Clear inventory history (simulated - would need inventory model)
const clearInventoryHistory = async (req, res) => {
  try {
    // For now, just log the action since inventory history might be part of other models
    await ClearDataHistory.create({
      action: 'inventory',
      actionLabel: 'Inventory History',
      recordsAffected: 0,
      details: 'Inventory history clearance logged (implementation depends on inventory model)'
    });

    res.status(200).json({
      success: true,
      message: 'Inventory history clearance logged',
      recordsAffected: 0
    });
  } catch (error) {
    console.error('Error clearing inventory history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear inventory history',
      error: error.message
    });
  }
};

// Clear backup data (simulated)
const clearBackupData = async (req, res) => {
  try {
    // This would typically involve file system operations
    await ClearDataHistory.create({
      action: 'backup',
      actionLabel: 'Backup Data',
      recordsAffected: 0,
      details: 'Backup data clearance logged (file system operations not implemented)'
    });

    res.status(200).json({
      success: true,
      message: 'Backup data clearance logged',
      recordsAffected: 0
    });
  } catch (error) {
    console.error('Error clearing backup data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear backup data',
      error: error.message
    });
  }
};

// Clear all data (system reset)
const clearAllData = async (req, res) => {
  try {
    // Clear all collections (except system collections and clear history)
    const collections = [
      Sale, Product, Customer, Voucher, CashPayment, CashReceipt,
      BankPayment, BankReceipt, ChequeTransfer, ClaimInFromCustomer, ClaimOutToSupplier
    ];

    let totalRecords = 0;
    for (const Model of collections) {
      const result = await Model.deleteMany({});
      totalRecords += result.deletedCount;
    }

    // Log the action
    await ClearDataHistory.create({
      action: 'all',
      actionLabel: 'All Data (Reset System)',
      recordsAffected: totalRecords,
      details: `Complete system reset - cleared ${totalRecords} records from all collections`
    });

    res.status(200).json({
      success: true,
      message: `System reset completed. Cleared ${totalRecords} records from all collections`,
      recordsAffected: totalRecords
    });
  } catch (error) {
    console.error('Error clearing all data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear all data',
      error: error.message
    });
  }
};

// Get data count for preview
const getDataCount = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let count = 0;
    let details = {};

    switch (type) {
      case 'sales':
        count = await Sale.countDocuments(query);
        details = { collection: 'Sales' };
        break;
      case 'products':
        count = await Product.countDocuments();
        details = { collection: 'Products' };
        break;
      case 'customers':
        count = await Customer.countDocuments();
        details = { collection: 'Customers' };
        break;
      case 'transactions':
        const cashPaymentCount = await CashPayment.countDocuments(query);
        const cashReceiptCount = await CashReceipt.countDocuments(query);
        const bankPaymentCount = await BankPayment.countDocuments(query);
        const bankReceiptCount = await BankReceipt.countDocuments(query);
        const chequeTransferCount = await ChequeTransfer.countDocuments(query);
        const claimInCount = await ClaimInFromCustomer.countDocuments(query);
        const claimOutCount = await ClaimOutToSupplier.countDocuments(query);
        count = cashPaymentCount + cashReceiptCount + bankPaymentCount +
                bankReceiptCount + chequeTransferCount + claimInCount + claimOutCount;
        details = { collections: ['Cash Payments', 'Cash Receipts', 'Bank Payments', 'Bank Receipts', 'Cheque Transfers', 'Claims'] };
        break;
      case 'all':
        const allCollections = [Sale, Product, Customer, Voucher, CashPayment, CashReceipt,
                              BankPayment, BankReceipt, ChequeTransfer, ClaimInFromCustomer, ClaimOutToSupplier];
        for (const Model of allCollections) {
          count += await Model.countDocuments();
        }
        details = { collections: 'All Collections' };
        break;
      default:
        count = 0;
    }

    res.status(200).json({
      success: true,
      data: {
        type,
        count,
        details,
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Error getting data count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get data count',
      error: error.message
    });
  }
};

module.exports = {
  getClearHistory,
  clearSalesData,
  clearProductData,
  clearCustomerData,
  clearTransactionLogs,
  clearInventoryHistory,
  clearBackupData,
  clearAllData,
  getDataCount
};
