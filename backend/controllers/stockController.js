const { fetchStock } = require('../services/tmsModulesService');

const getStock = async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = req.query.limit ? Number(req.query.limit) : 5000;
    const stock = await fetchStock(search, limit);
    res.json(stock);
  } catch (error) {
    console.error('GET /api/stock error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStock };
