const express = require('express');
const router = express.Router();
const {
  getBankReceipts,
  getBankReceipt,
  createBankReceipt,
  updateBankReceipt,
  deleteBankReceipt,
  searchBankReceipts
} = require('../controllers/bankReceiptController');

// Routes
router.route('/').get(getBankReceipts).post(createBankReceipt);
router.route('/:id').get(getBankReceipt).put(updateBankReceipt).delete(deleteBankReceipt);
router.route('/search/:query').get(searchBankReceipts);

module.exports = router;
