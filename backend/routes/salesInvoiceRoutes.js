const express = require('express');
const router = express.Router();
const {
  getSalesInvoices,
  getSalesInvoice,
  getLatestSalesInvoice,
} = require('../controllers/salesInvoiceController');

router.get('/latest', getLatestSalesInvoice);
router.route('/').get(getSalesInvoices);
router.route('/:id').get(getSalesInvoice);

module.exports = router;
