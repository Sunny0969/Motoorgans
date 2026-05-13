const express = require('express');
const router = express.Router();
const {
  getVouchers,
  getVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  searchVouchers,
  getVouchersByType
} = require('../controllers/voucherController');

// Routes
router.route('/').get(getVouchers).post(createVoucher);
router.route('/:id').get(getVoucher).put(updateVoucher).delete(deleteVoucher);
router.route('/search/:query').get(searchVouchers);
router.route('/type/:type').get(getVouchersByType);

module.exports = router;
