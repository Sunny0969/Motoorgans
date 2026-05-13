const FontSettings = require('../models/FontSettings');

// Get font settings for a user (or global)
const getFontSettings = async (req, res) => {
  try {
    const { userId = 'global' } = req.params;
    const settings = await FontSettings.findOne({ userId });
    if (!settings) {
      // Return default settings if none exist
      return res.json({
        userId,
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal',
        fontStyle: 'normal',
        isApplied: false
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create or update font settings
const saveFontSettings = async (req, res) => {
  try {
    const { userId = 'global', fontFamily, fontSize, fontWeight, fontStyle, isApplied } = req.body;
    const settings = await FontSettings.findOneAndUpdate(
      { userId },
      { fontFamily, fontSize, fontWeight, fontStyle, isApplied },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset to defaults
const resetFontSettings = async (req, res) => {
  try {
    const { userId = 'global' } = req.params;
    const settings = await FontSettings.findOneAndUpdate(
      { userId },
      {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal',
        fontStyle: 'normal',
        isApplied: false
      },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFontSettings,
  saveFontSettings,
  resetFontSettings
};
