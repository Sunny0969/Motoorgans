const { fetchDashboardData } = require('../services/dashboardService');

const getDashboard = async (req, res) => {
  try {
    const activityDate = req.query.date || '';
    const data = await fetchDashboardData(activityDate || null);
    res.json(data);
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard };
