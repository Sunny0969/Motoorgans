const { fetchTempLedger } = require('../services/tmsModulesService');

const getTempLedger = async (req, res) => {
  try {
    const search = req.query.search || req.query.q || '';
    const accountId = req.query.accountId || '';
    const fromDate = req.query.fromDate || req.query.startDate || '';
    const toDate = req.query.toDate || req.query.endDate || '';
    const type = req.query.type || '';
    const limit = req.query.limit ? Number(req.query.limit) : 5000;

    const entries = await fetchTempLedger(search, limit, {
      accountId,
      fromDate,
      toDate,
      type,
    });

    const totalDebit = entries.reduce((sum, row) => sum + (parseFloat(row.debit) || 0), 0);
    const totalCredit = entries.reduce((sum, row) => sum + (parseFloat(row.credit) || 0), 0);
    const lastEntry = entries[entries.length - 1];

    res.json({
      entries,
      summary: {
        totalEntries: entries.length,
        totalDebit,
        totalCredit,
        closingBalance: lastEntry?.balance ?? 0,
      },
    });
  } catch (error) {
    console.error('GET /api/temp-ledger error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTempLedger };
