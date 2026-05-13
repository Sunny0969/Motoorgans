const express = require('express');
const router = express.Router();
const {
  getStockOverview,
  getStockProducts,
  getLowStockItems,
  getStockMovements,
  updateProductStock,
  getStockCategories,
  getStockAlerts,
  bulkUpdateStock
} = require('../controllers/stockManagementController');

// Routes
router.route('/overview')
  .get(getStockOverview);

router.route('/products')
  .get(getStockProducts);

router.route('/products/:id/stock')
  .put(updateProductStock);

router.route('/low-stock')
  .get(getLowStockItems);

router.route('/movements')
  .get(getStockMovements);

router.route('/categories')
  .get(getStockCategories);

router.route('/alerts')
  .get(getStockAlerts);

router.route('/bulk-update')
  .put(bulkUpdateStock);

module.exports = router;
