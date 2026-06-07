const { fetchCompanies, upsertCompanyColor } = require('../services/tmsModulesService');

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

const upsertCompanyColorHandler = async (req, res) => {
  try {
    const name = req.body.name || req.body.company || '';
    const color = req.body.color;
    if (!name.trim()) {
      return res.status(400).json({ message: 'Company name is required.' });
    }
    if (color == null || color === '') {
      return res.status(400).json({ message: 'Color is required.' });
    }
    const id = await upsertCompanyColor(name, color);
    res.json({ id, name: name.trim(), color: String(color), message: 'Company color saved.' });
  } catch (error) {
    console.error('PUT /api/companies/color error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCompanies, upsertCompanyColorHandler };
