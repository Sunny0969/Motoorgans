const express = require('express');
const router = express.Router();
const {
  getSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
  searchSales
} = require('../controllers/saleController');

// Routes
router.route('/').get(getSales).post(createSale);
router.route('/:id').get(getSale).put(updateSale).delete(deleteSale);
router.route('/search/:query').get(searchSales);

module.exports = router;
