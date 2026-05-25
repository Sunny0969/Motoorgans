const {
  fetchLedger,
  fetchLedgerOpeningBalance,
} = require('../services/tmsModulesService');

const getLedger = async (req, res) => {
  try {
    const search = req.query.search || req.query.q || '';
    const accountId = req.query.accountId || '';
    const fromDate = req.query.fromDate || req.query.startDate || '';
    const toDate = req.query.toDate || req.query.endDate || '';
    const defaultLimit = accountId ? 5000 : 200;
    const limit = req.query.limit ? Number(req.query.limit) : defaultLimit;

    const entries = await fetchLedger(search, limit, {
      accountId,
      fromDate,
      toDate,
    });

    let openingBalance = 0;
    if (accountId && fromDate) {
      try {
        openingBalance = await fetchLedgerOpeningBalance(accountId, fromDate);
      } catch (openingErr) {
        console.warn('Opening balance skipped:', openingErr.message);
      }
    }

    const totalDebit = entries.reduce((sum, row) => sum + (parseFloat(row.debit) || 0), 0);
    const totalCredit = entries.reduce((sum, row) => sum + (parseFloat(row.credit) || 0), 0);
    const lastEntry = entries[entries.length - 1];
    const closingBalance =
      lastEntry?.remainingAmount ?? lastEntry?.balance ?? openingBalance + totalDebit - totalCredit;

    res.json({
      entries,
      summary: {
        totalEntries: entries.length,
        openingBalance,
        totalDebit,
        totalCredit,
        closingBalance,
      },
    });
  } catch (error) {
    console.error('GET /api/ledger error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLedger };
