const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  resetSettings,
  previewSettings,
  getSettingsSummary
} = require('../controllers/mainPageSettingsController');

const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @route   GET /api/main-page-settings
// @desc    Get main page settings
// @access  Private
router.get('/', getSettings);

// @route   PUT /api/main-page-settings
// @desc    Update main page settings
// @access  Private
router.put('/', updateSettings);

// @route   POST /api/main-page-settings/reset
// @desc    Reset settings to defaults
// @access  Private
router.post('/reset', resetSettings);

// @route   POST /api/main-page-settings/preview
// @desc    Preview settings
// @access  Private
router.post('/preview', previewSettings);

// @route   GET /api/main-page-settings/summary
// @desc    Get settings summary
// @access  Private
router.get('/summary', getSettingsSummary);

module.exports = router;
