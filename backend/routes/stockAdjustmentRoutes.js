const express = require('express');
const router = express.Router();
const {
  getNextNumber,
  getLatest,
  getStockAdjustments,
  getStockAdjustment,
  getLocations,
  getProduct,
  getStockAtLocation,
  createStockAdjustment,
  updateStockAdjustment,
  deleteStockAdjustment,
} = require('../controllers/stockAdjustmentController');

router.get('/next-number', getNextNumber);
router.get('/latest', getLatest);
router.get('/locations', getLocations);
router.get('/available/:productId', getStockAtLocation);
router.get('/product/:productId', getProduct);

router.route('/')
  .get(getStockAdjustments)
  .post(createStockAdjustment);

router.route('/:doc')
  .get(getStockAdjustment)
  .put(updateStockAdjustment)
  .delete(deleteStockAdjustment);

module.exports = router;
