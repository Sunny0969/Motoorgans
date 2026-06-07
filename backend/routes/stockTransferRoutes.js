const express = require('express');
const router = express.Router();
const {
  getNextNumber,
  getLatest,
  getStockTransfers,
  getStockTransfer,
  getLocations,
  getProduct,
  getStockAtLocation,
  createStockTransfer,
  updateStockTransfer,
  deleteStockTransfer,
} = require('../controllers/stockTransferController');

router.get('/next-number', getNextNumber);
router.get('/latest', getLatest);
router.get('/locations', getLocations);
router.get('/available/:productId', getStockAtLocation);
router.get('/product/:productId', getProduct);

router.route('/')
  .get(getStockTransfers)
  .post(createStockTransfer);

router.route('/:doc')
  .get(getStockTransfer)
  .put(updateStockTransfer)
  .delete(deleteStockTransfer);

module.exports = router;
