const express = require('express');
const router = express.Router();
const {
  getCashReceipts,
  getCashReceipt,
  createCashReceipt,
  updateCashReceipt,
  deleteCashReceipt,
  searchCashReceipts
} = require('../controllers/cashReceiptController');

// Routes
router.route('/').get(getCashReceipts).post(createCashReceipt);
router.route('/:id').get(getCashReceipt).put(updateCashReceipt).delete(deleteCashReceipt);
router.route('/search/:query').get(searchCashReceipts);

module.exports = router;
