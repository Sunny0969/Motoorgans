const express = require('express');
const router = express.Router();
const {
  getStockTransfers,
  getStockTransfer,
  createStockTransfer,
  updateStockTransfer,
  deleteStockTransfer,
  dispatchStockTransfer,
  receiveStockTransfer,
  getStockTransferStats,
  getProductsForTransfer
} = require('../controllers/stockTransferController');

// Routes
router.route('/')
  .get(getStockTransfers)
  .post(createStockTransfer);

router.route('/stats')
  .get(getStockTransferStats);

router.route('/products')
  .get(getProductsForTransfer);

router.route('/:id')
  .get(getStockTransfer)
  .put(updateStockTransfer)
  .delete(deleteStockTransfer);

router.route('/:id/dispatch')
  .put(dispatchStockTransfer);

router.route('/:id/receive')
  .put(receiveStockTransfer);

module.exports = router;
