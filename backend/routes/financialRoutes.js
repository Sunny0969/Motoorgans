const express = require('express');
const router = express.Router();
const {
  getBalanceSheet,
  getProfitLoss,
  getYearEndClosing
} = require('../controllers/financialController');

// Routes
router.route('/balance-sheet').get(getBalanceSheet);
router.route('/profit-loss').get(getProfitLoss);
router.route('/year-end-closing').get(getYearEndClosing);

module.exports = router;
