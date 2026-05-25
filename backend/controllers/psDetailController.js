const { fetchPSDetail } = require('../services/tmsModulesService');

const getPSDetail = async (req, res) => {
  try {
    const search = req.query.search || '';
    const type = req.query.type || '';
    const accountId = req.query.accountId || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const limit = req.query.limit ? Number(req.query.limit) : 500;

    const entries = await fetchPSDetail(search, limit, {
      type,
      accountId,
      fromDate,
      toDate,
    });

    const totalAmount = entries.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    const totalReceived = entries.reduce((sum, row) => sum + (parseFloat(row.received) || 0), 0);

    res.json({
      entries,
      summary: {
        totalEntries: entries.length,
        totalAmount,
        totalReceived,
      },
    });
  } catch (error) {
    console.error('GET /api/ps-detail error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPSDetail };
