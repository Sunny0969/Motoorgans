const express = require('express');
const router = express.Router();
const { getTrialBalanceSpo, exportTrialBalanceSpo } = require('../controllers/trialBalanceSpoController');

// Routes for Trial Balance SPO-wise
router.get('/trial-balance-spo', getTrialBalanceSpo);
router.get('/trial-balance-spo/export', exportTrialBalanceSpo);

module.exports = router;
