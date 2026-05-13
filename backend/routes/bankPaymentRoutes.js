const express = require('express');
const router = express.Router();
const {
  getBankPayments,
  getBankPayment,
  createBankPayment,
  updateBankPayment,
  deleteBankPayment,
  searchBankPayments
} = require('../controllers/bankPaymentController');

// Routes
router.route('/').get(getBankPayments).post(createBankPayment);
router.route('/:id').get(getBankPayment).put(updateBankPayment).delete(deleteBankPayment);
router.route('/search/:query').get(searchBankPayments);

module.exports = router;
