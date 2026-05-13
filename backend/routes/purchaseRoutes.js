const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  searchPurchases
} = require('../controllers/purchaseController');

// Routes
router.route('/').get(getPurchases).post(createPurchase);
router.route('/:id').get(getPurchase).put(updatePurchase).delete(deletePurchase);
router.route('/search/:query').get(searchPurchases);

module.exports = router;
