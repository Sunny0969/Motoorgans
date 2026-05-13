const express = require('express');
const router = express.Router();
const {
  getSaleOrders,
  getSaleOrder,
  createSaleOrder,
  updateSaleOrder,
  deleteSaleOrder,
  getNextOrderNumber,
  searchSaleOrders
} = require('../controllers/saleOrderController');

// Routes
router.route('/')
  .get(getSaleOrders)
  .post(createSaleOrder);

router.route('/:id')
  .get(getSaleOrder)
  .put(updateSaleOrder)
  .delete(deleteSaleOrder);

router.route('/next-order-number')
  .get(getNextOrderNumber);

router.route('/search/:query')
  .get(searchSaleOrders);

module.exports = router;
