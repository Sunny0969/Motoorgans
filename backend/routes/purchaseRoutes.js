const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getPurchase,
  getLatestPurchase,
  getNextNumber,
  getSupplierBalance,
  getProductHistory,
  createPurchase,
  updatePurchase,
  deletePurchase,
  searchPurchases,
} = require('../controllers/purchaseController');

router.get('/latest', getLatestPurchase);
router.get('/next-number', getNextNumber);
router.get('/search/:query', searchPurchases);
router.get('/supplier/:id/balance', getSupplierBalance);
router.get('/product-history/:productId', getProductHistory);
router.route('/').get(getPurchases).post(createPurchase);
router.route('/:id').get(getPurchase).put(updatePurchase).delete(deletePurchase);

module.exports = router;
