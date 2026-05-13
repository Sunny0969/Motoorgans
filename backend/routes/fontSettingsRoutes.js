const express = require('express');
const router = express.Router();
const {
  getFontSettings,
  saveFontSettings,
  resetFontSettings
} = require('../controllers/fontSettingsController');

// GET /api/font-settings/:userId - Get font settings
router.get('/:userId', getFontSettings);

// POST /api/font-settings - Save font settings
router.post('/', saveFontSettings);

// PUT /api/font-settings/reset - Reset to defaults
router.put('/reset', resetFontSettings);

module.exports = router;
