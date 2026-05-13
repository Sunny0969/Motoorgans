const express = require('express');
const router = express.Router();
const {
  getMonthlyTransactionReport,
  getDetailedTransactionList,
  exportMonthlyTransactionReport
} = require('../controllers/monthlyTransactionReportController');

// Routes
router.route('/')
  .get(getMonthlyTransactionReport);

router.route('/detailed')
  .get(getDetailedTransactionList);

router.route('/export')
  .get(exportMonthlyTransactionReport);

module.exports = router;
