const express = require('express');
const router = express.Router();
const {
  getEventLogs,
  getEventLog,
  createEventLog,
  getEventLogStatistics,
  getEventLogSummary,
  cleanupEventLogs,
  exportEventLogs,
  getFilterOptions
} = require('../controllers/eventLogController');

// Routes
router.route('/')
  .get(getEventLogs)
  .post(createEventLog);

router.route('/statistics')
  .get(getEventLogStatistics);

router.route('/summary')
  .get(getEventLogSummary);

router.route('/filters')
  .get(getFilterOptions);

router.route('/export')
  .get(exportEventLogs);

router.route('/cleanup')
  .delete(cleanupEventLogs);

router.route('/:id')
  .get(getEventLog);

module.exports = router;
