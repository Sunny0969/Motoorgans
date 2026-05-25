const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getPurchase,
  getLatestPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  searchPurchases
} = require('../controllers/purchaseController');

// Routes
router.get('/latest', getLatestPurchase);
router.get('/search/:query', searchPurchases);
router.route('/').get(getPurchases).post(createPurchase);
router.route('/:id').get(getPurchase).put(updatePurchase).delete(deletePurchase);

module.exports = router;
