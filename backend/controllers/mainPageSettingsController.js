const MainPageSettings = require('../models/MainPageSettings');

// @desc    Get main page settings
// @route   GET /api/main-page-settings
// @access  Private (requires authentication)
const getSettings = async (req, res) => {
  try {
    const settings = await MainPageSettings.getSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching settings'
    });
  }
};

// @desc    Update main page settings
// @route   PUT /api/main-page-settings
// @access  Private (requires authentication)
const updateSettings = async (req, res) => {
  try {
    const settings = await MainPageSettings.getSettings();

    // Update fields from request body
    const allowedFields = [
      'businessName', 'businessLogo', 'themeColor', 'language', 'currency', 'timezone',
      'showImages', 'showPrices', 'showStock', 'quickButtons', 'recentProducts',
      'receiptHeader', 'receiptFooter', 'printAutomatically', 'printCustomerCopy', 'printKitchenCopy',
      'autoLogout', 'requirePassword', 'adminApproval', 'auditLog',
      'lowStockAlert', 'salesNotifications', 'soundEnabled', 'emailReports'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    // Set updatedBy if user is authenticated
    if (req.user && req.user.userId) {
      settings.updatedBy = req.user.userId;
    }

    const updatedSettings = await settings.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });

  } catch (error) {
    console.error('Update settings error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating settings'
    });
  }
};

// @desc    Reset settings to defaults
// @route   POST /api/main-page-settings/reset
// @access  Private (requires authentication)
const resetSettings = async (req, res) => {
  try {
    const settings = await MainPageSettings.getSettings();

    // Reset to default values
    settings.businessName = 'My POS Business';
    settings.businessLogo = '';
    settings.themeColor = '#007bff';
    settings.language = 'en';
    settings.currency = 'USD';
    settings.timezone = 'UTC-5';

    settings.showImages = true;
    settings.showPrices = true;
    settings.showStock = true;
    settings.quickButtons = true;
    settings.recentProducts = true;

    settings.receiptHeader = 'Thank you for your business!';
    settings.receiptFooter = 'Returns within 7 days with receipt';
    settings.printAutomatically = false;
    settings.printCustomerCopy = true;
    settings.printKitchenCopy = false;

    settings.autoLogout = 30;
    settings.requirePassword = true;
    settings.adminApproval = false;
    settings.auditLog = true;

    settings.lowStockAlert = true;
    settings.salesNotifications = true;
    settings.soundEnabled = true;
    settings.emailReports = false;

    // Set updatedBy if user is authenticated
    if (req.user && req.user.userId) {
      settings.updatedBy = req.user.userId;
    }

    const resetSettings = await settings.save();

    res.json({
      success: true,
      message: 'Settings reset to defaults successfully',
      data: resetSettings
    });

  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting settings'
    });
  }
};

// @desc    Preview settings (simulate how settings would look)
// @route   POST /api/main-page-settings/preview
// @access  Private (requires authentication)
const previewSettings = async (req, res) => {
  try {
    // This would typically generate a preview of how the settings would affect the UI
    // For now, we'll just return the current settings with a preview flag
    const settings = await MainPageSettings.getSettings();

    res.json({
      success: true,
      message: 'Preview generated successfully',
      data: {
        ...settings.toObject(),
        preview: true,
        previewTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Preview settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating preview'
    });
  }
};

// @desc    Get settings summary (for dashboard or quick overview)
// @route   GET /api/main-page-settings/summary
// @access  Private (requires authentication)
const getSettingsSummary = async (req, res) => {
  try {
    const settings = await MainPageSettings.getSettings();

    // Return a summary of key settings
    const summary = {
      businessName: settings.businessName,
      themeColor: settings.themeColor,
      language: settings.language,
      currency: settings.currency,
      timezone: settings.timezone,
      displaySettings: {
        showImages: settings.showImages,
        showPrices: settings.showPrices,
        showStock: settings.showStock
      },
      securitySettings: {
        autoLogout: settings.autoLogout,
        requirePassword: settings.requirePassword,
        auditLog: settings.auditLog
      },
      notificationSettings: {
        lowStockAlert: settings.lowStockAlert,
        salesNotifications: settings.salesNotifications,
        emailReports: settings.emailReports
      },
      lastUpdated: settings.updatedAt
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Get settings summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching settings summary'
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  resetSettings,
  previewSettings,
  getSettingsSummary
};
