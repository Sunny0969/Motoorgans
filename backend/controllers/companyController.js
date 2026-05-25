const { fetchCompanies } = require('../services/tmsModulesService');

const getCompanies = async (req, res) => {
  try {
    const search = req.query.search || req.query.q || '';
    const limit = req.query.limit ? Number(req.query.limit) : 5000;

    const { entries, columns } = await fetchCompanies(search, limit);

    res.json({
      entries,
      columns,
      summary: {
        totalEntries: entries.length,
      },
    });
  } catch (error) {
    console.error('GET /api/companies error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCompanies };
