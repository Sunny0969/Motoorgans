const { fetchProductHistory } = require('../services/tmsModulesService');

const getProductHistory = async (req, res) => {
  try {
    const search = req.query.search || '';
    const type = req.query.type || '';
    const accountId = req.query.accountId || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const limit = req.query.limit ? Number(req.query.limit) : 1000;

    const history = await fetchProductHistory(search, limit, {
      type,
      accountId,
      fromDate,
      toDate,
    });

    res.json(history);
  } catch (error) {
    console.error('GET /api/product-history error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProductHistory };
