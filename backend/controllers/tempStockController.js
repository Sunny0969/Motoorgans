const { fetchTempStock } = require('../services/tmsModulesService');

const getTempStock = async (req, res) => {
  try {
    const search = req.query.search || req.query.q || '';
    const productId = req.query.productId || req.query.prid || '';
    const fromDate = req.query.fromDate || req.query.startDate || '';
    const toDate = req.query.toDate || req.query.endDate || '';
    const limit = req.query.limit ? Number(req.query.limit) : 5000;

    const { entries, columns } = await fetchTempStock(search, limit, {
      productId,
      fromDate,
      toDate,
    });

    const lastEntry = entries[entries.length - 1];
    const totalOut = entries.reduce((sum, row) => sum + (parseFloat(row.qtyOut) || 0), 0);
    const totalIn = entries.reduce((sum, row) => sum + (parseFloat(row.qtyIn) || 0), 0);

    res.json({
      entries,
      columns,
      summary: {
        totalEntries: entries.length,
        totalIn,
        totalOut,
        closingBalance: lastEntry?.balance ?? 0,
      },
    });
  } catch (error) {
    console.error('GET /api/temp-stock error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTempStock };
