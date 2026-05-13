const express = require('express');
const router = express.Router();
const {
  getTrialBalance,
  exportTrialBalance
} = require('../controllers/trialBalanceController');

// Routes
router.route('/')
  .get(getTrialBalance);

router.route('/export')
  .get(exportTrialBalance);

module.exports = router;
