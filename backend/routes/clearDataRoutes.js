const express = require('express');
const router = express.Router();
const clearDataController = require('../controllers/clearDataController');

// Get clear data history
router.get('/history', clearDataController.getClearHistory);

// Get data count for preview
router.get('/count', clearDataController.getDataCount);

// Clear sales data
router.delete('/sales', clearDataController.clearSalesData);

// Clear product data
router.delete('/products', clearDataController.clearProductData);

// Clear customer data
router.delete('/customers', clearDataController.clearCustomerData);

// Clear transaction logs
router.delete('/transactions', clearDataController.clearTransactionLogs);

// Clear inventory history
router.delete('/inventory', clearDataController.clearInventoryHistory);

// Clear backup data
router.delete('/backup', clearDataController.clearBackupData);

// Clear all data (system reset)
router.delete('/all', clearDataController.clearAllData);

module.exports = router;
