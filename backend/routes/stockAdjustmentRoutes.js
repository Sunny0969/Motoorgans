const express = require('express');
const router = express.Router();
const {
  getStockAdjustments,
  getStockAdjustment,
  createStockAdjustment,
  updateStockAdjustment,
  deleteStockAdjustment,
  submitStockAdjustment,
  approveStockAdjustment,
  completeStockAdjustment,
  getProductsForAdjustment,
  getNextAdjustmentNumber
} = require('../controllers/stockAdjustmentController');

// Routes
router.route('/')
  .get(getStockAdjustments)
  .post(createStockAdjustment);

router.route('/:id')
  .get(getStockAdjustment)
  .put(updateStockAdjustment)
  .delete(deleteStockAdjustment);

router.route('/:id/submit')
  .put(submitStockAdjustment);

router.route('/:id/approve')
  .put(approveStockAdjustment);

router.route('/:id/complete')
  .put(completeStockAdjustment);

router.route('/products')
  .get(getProductsForAdjustment);

router.route('/next-number')
  .get(getNextAdjustmentNumber);

module.exports = router;
