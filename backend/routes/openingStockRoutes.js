const express = require('express');
const router = express.Router();
const openingStockController = require('../controllers/openingStockController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all opening stock entries
router.get('/', openingStockController.getAllOpeningStocks);

// Get opening stock by ID
router.get('/:id', openingStockController.getOpeningStockById);

// Create new opening stock entry
router.post('/', openingStockController.createOpeningStock);

// Update opening stock entry
router.put('/:id', openingStockController.updateOpeningStock);

// Delete opening stock entry
router.delete('/:id', openingStockController.deleteOpeningStock);

// Get products for dropdown
router.get('/products/dropdown', openingStockController.getProductsForDropdown);

// Import opening stock from Excel
router.post('/import', openingStockController.importOpeningStock);

// Export opening stock to Excel
router.get('/:id/export', openingStockController.exportOpeningStock);

module.exports = router;
