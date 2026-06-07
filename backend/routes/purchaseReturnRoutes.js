const express = require('express');
const router = express.Router();
const {
  getPurchaseReturns,
  getPurchaseReturn,
  getLatestPurchaseReturn,
  getNextNumber,
  getSupplierBalance,
  getProductHistory,
  createReturn,
  updateReturn,
  deleteReturn,
  searchPurchaseReturns,
} = require('../controllers/purchaseReturnController');

router.get('/latest', getLatestPurchaseReturn);
router.get('/next-number', getNextNumber);
router.get('/search/:query', searchPurchaseReturns);
router.get('/supplier/:id/balance', getSupplierBalance);
router.get('/product-history/:productId', getProductHistory);
router.route('/').get(getPurchaseReturns).post(createReturn);
router.route('/:id').get(getPurchaseReturn).put(updateReturn).delete(deleteReturn);

module.exports = router;
