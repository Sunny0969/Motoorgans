const express = require('express');
const router = express.Router();
const {
  getTrialBalance,
  exportTrialBalance
} = require('../controllers/trialBalanceController');
const { fetchTrialBalance } = require('../utils/mssqlRepository');

router.get('/mssql', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const data = await fetchTrialBalance(fromDate, toDate);
    const totalDebit = data.reduce((sum, r) => sum + (r.debit || 0), 0);
    const totalCredit = data.reduce((sum, r) => sum + (r.credit || 0), 0);
    res.json({ accounts: data, totalDebit, totalCredit, balance: totalDebit - totalCredit });
  } catch (err) {
    console.error('Trial balance error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.route('/')
  .get(getTrialBalance);

router.route('/export')
  .get(exportTrialBalance);

module.exports = router;
