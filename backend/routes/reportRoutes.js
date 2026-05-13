const express = require('express');
const router = express.Router();
const {
  getAccountActivity,
  getGeneralLedger,
  getAccountStatus
} = require('../controllers/reportController');

// Routes
router.route('/account-activity').get(getAccountActivity);
router.route('/general-ledger').get(getGeneralLedger);
router.route('/account-status').get(getAccountStatus);

module.exports = router;
