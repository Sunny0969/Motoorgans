const { fetchTempPnL } = require('../services/tmsModulesService');

const getTempPnL = async (req, res) => {
  try {
    const search = req.query.search || req.query.q || '';
    const headId = req.query.headId || '';
    const head = req.query.head || '';
    const limit = req.query.limit ? Number(req.query.limit) : 5000;

    const { entries, columns } = await fetchTempPnL(search, limit, {
      headId,
      head,
    });

    const totalValue = entries.reduce((sum, row) => sum + (parseFloat(row.value) || 0), 0);
    const netProfitRow = entries.find((row) =>
      String(row.head || '').toUpperCase().includes('NET PROFIT')
    );

    res.json({
      entries,
      columns,
      summary: {
        totalEntries: entries.length,
        totalValue,
        netProfit: netProfitRow?.value ?? null,
      },
    });
  } catch (error) {
    console.error('GET /api/temp-pnl error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTempPnL };
