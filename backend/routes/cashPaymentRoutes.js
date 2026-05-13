const express = require('express');
const router = express.Router();
const {
  getCashPayments,
  getCashPayment,
  createCashPayment,
  updateCashPayment,
  deleteCashPayment,
  searchCashPayments
} = require('../controllers/cashPaymentController');

// Routes
router.route('/').get(getCashPayments).post(createCashPayment);
router.route('/:id').get(getCashPayment).put(updateCashPayment).delete(deleteCashPayment);
router.route('/search/:query').get(searchCashPayments);

module.exports = router;
