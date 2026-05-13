const mongoose = require('mongoose');

const mainPageSettingsSchema = new mongoose.Schema({
  // General Settings
  businessName: {
    type: String,
    default: 'My POS Business',
    trim: true
  },
  businessLogo: {
    type: String,
    default: '',
    trim: true
  },
  themeColor: {
    type: String,
    default: '#007bff',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Theme color must be a valid hex color'
    }
  },
  language: {
    type: String,
    enum: ['en', 'es', 'fr', 'de', 'ar', 'zh', 'hi'],
    default: 'en'
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'PKR', 'INR', 'AED'],
    default: 'USD'
  },
  timezone: {
    type: String,
    default: 'UTC-5',
    enum: ['UTC-12', 'UTC-11', 'UTC-10', 'UTC-9', 'UTC-8', 'UTC-7', 'UTC-6', 'UTC-5', 'UTC-4', 'UTC-3', 'UTC-2', 'UTC-1', 'UTC+0', 'UTC+1', 'UTC+2', 'UTC+3', 'UTC+4', 'UTC+5', 'UTC+6', 'UTC+7', 'UTC+8', 'UTC+9', 'UTC+10', 'UTC+11', 'UTC+12']
  },

  // Display Settings
  showImages: {
    type: Boolean,
    default: true
  },
  showPrices: {
    type: Boolean,
    default: true
  },
  showStock: {
    type: Boolean,
    default: true
  },
  quickButtons: {
    type: Boolean,
    default: true
  },
  recentProducts: {
    type: Boolean,
    default: true
  },

  // Receipt Settings
  receiptHeader: {
    type: String,
    default: 'Thank you for your business!',
    maxlength: 500
  },
  receiptFooter: {
    type: String,
    default: 'Returns within 7 days with receipt',
    maxlength: 500
  },
  printAutomatically: {
    type: Boolean,
    default: false
  },
  printCustomerCopy: {
    type: Boolean,
    default: true
  },
  printKitchenCopy: {
    type: Boolean,
    default: false
  },

  // Security Settings
  autoLogout: {
    type: Number,
    default: 30,
    min: 1,
    max: 480 // 8 hours max
  },
  requirePassword: {
    type: Boolean,
    default: true
  },
  adminApproval: {
    type: Boolean,
    default: false
  },
  auditLog: {
    type: Boolean,
    default: true
  },

  // Notification Settings
  lowStockAlert: {
    type: Boolean,
    default: true
  },
  salesNotifications: {
    type: Boolean,
    default: true
  },
  soundEnabled: {
    type: Boolean,
    default: true
  },
  emailReports: {
    type: Boolean,
    default: false
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'mainpagesettings'
});

// Static method to get the single settings document
mainPageSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    // Create default settings if none exists
    settings = await this.create({
      businessName: 'My POS Business',
      businessLogo: '',
      themeColor: '#007bff',
      language: 'en',
      currency: 'USD',
      timezone: 'UTC-5',
      showImages: true,
      showPrices: true,
      showStock: true,
      quickButtons: true,
      recentProducts: true,
      receiptHeader: 'Thank you for your business!',
      receiptFooter: 'Returns within 7 days with receipt',
      printAutomatically: false,
      printCustomerCopy: true,
      printKitchenCopy: false,
      autoLogout: 30,
      requirePassword: true,
      adminApproval: false,
      auditLog: true,
      lowStockAlert: true,
      salesNotifications: true,
      soundEnabled: true,
      emailReports: false
    });
  }
  return settings;
};

// Pre-save middleware to update timestamps
mainPageSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MainPageSettings', mainPageSettingsSchema);
