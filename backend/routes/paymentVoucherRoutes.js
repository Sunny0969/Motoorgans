const express = require('express');
const router = express.Router();
const {
  getAllPaymentVouchers,
  getPaymentVoucherById,
  createPaymentVoucher,
  updatePaymentVoucher,
  deletePaymentVoucher,
  getPaymentVoucherStats
} = require('../controllers/paymentVoucherController');

// Routes
router.route('/')
  .get(getAllPaymentVouchers)
  .post(createPaymentVoucher);

router.route('/:id')
  .get(getPaymentVoucherById)
  .put(updatePaymentVoucher)
  .delete(deletePaymentVoucher);

router.route('/stats/summary')
  .get(getPaymentVoucherStats);

module.exports = router;
