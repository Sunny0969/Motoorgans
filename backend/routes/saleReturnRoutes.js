const express = require('express');
const router = express.Router();
const {
  getSaleReturns,
  getSaleReturn,
  getLatest,
  getNextNumber,
  getCustomerBalance,
  createReturn,
  updateReturn,
  deleteReturn,
  searchSaleReturns,
} = require('../controllers/saleReturnController');

router.get('/latest', getLatest);
router.get('/next-number', getNextNumber);
router.get('/search/:query', searchSaleReturns);
router.get('/customer/:id/balance', getCustomerBalance);
router.route('/').get(getSaleReturns).post(createReturn);
router.route('/:id').get(getSaleReturn).put(updateReturn).delete(deleteReturn);

module.exports = router;
