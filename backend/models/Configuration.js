const mongoose = require('mongoose');

const taxRateSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  products: {
    type: String,
    required: true,
    enum: ['all', 'essential', 'exempt']
  }
});

const paymentMethodSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  processor: {
    type: String,
    required: true,
    enum: ['manual', 'stripe', 'square', 'paypal', 'internal']
  }
});

const printerSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    default: ''
  },
  paperSize: {
    type: String,
    enum: ['80mm', '58mm', 'A4', 'Letter'],
    default: '80mm'
  },
  copies: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  }
});

const configurationSchema = new mongoose.Schema({
  // Business Configuration
  business: {
    name: {
      type: String,
      required: true,
      default: 'SuperMart POS'
    },
    address: {
      type: String,
      required: true,
      default: '123 Main Street, City, State 12345'
    },
    phone: {
      type: String,
      required: true,
      default: '+1 (555) 123-4567'
    },
    email: {
      type: String,
      required: true,
      default: 'info@supermart.com'
    },
    taxId: {
      type: String,
      default: '12-3456789'
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'PKR', 'INR', 'AED'],
      default: 'USD'
    },
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    fiscalYearStart: {
      type: String,
      enum: ['January', 'April', 'July', 'October'],
      default: 'January'
    }
  },

  // POS Configuration
  pos: {
    defaultCustomer: {
      type: String,
      default: 'Walk-in'
    },
    defaultPayment: {
      type: String,
      enum: ['cash', 'card', 'mobile'],
      default: 'cash'
    },
    allowPriceOverride: {
      type: Boolean,
      default: true
    },
    requireReasonForReturn: {
      type: Boolean,
      default: true
    },
    autoPrintReceipt: {
      type: Boolean,
      default: false
    },
    showStockInCart: {
      type: Boolean,
      default: true
    },
    enableMultiWarehouse: {
      type: Boolean,
      default: false
    },
    barcodeScanner: {
      type: Boolean,
      default: true
    }
  },

  // Tax Configuration
  tax: {
    enabled: {
      type: Boolean,
      default: true
    },
    defaultRate: {
      type: Number,
      default: 8.5,
      min: 0,
      max: 100
    },
    inclusivePricing: {
      type: Boolean,
      default: false
    },
    rates: [taxRateSchema]
  },

  // Payment Methods
  payments: {
    methods: [paymentMethodSchema]
  },

  // Printers Configuration
  printers: {
    receipt: printerSchema,
    kitchen: printerSchema,
    invoice: printerSchema
  },

  // Backup Configuration
  backup: {
    autoBackup: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['disabled', 'daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    time: {
      type: String,
      default: '02:00'
    },
    location: {
      type: String,
      enum: ['local', 'cloud', 'both'],
      default: 'local'
    },
    cloudService: {
      type: String,
      enum: ['google_drive', 'dropbox', 'onedrive', 'aws_s3'],
      default: 'google_drive'
    },
    keepBackups: {
      type: Number,
      default: 30,
      min: 1,
      max: 365
    }
  },

  // Advanced Settings
  advanced: {
    sessionTimeout: {
      type: Number,
      default: 30,
      min: 1,
      max: 240
    },
    maxDiscount: {
      type: Number,
      default: 25,
      min: 0,
      max: 100
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 1
    },
    enableAuditLog: {
      type: Boolean,
      default: true
    },
    dataRetention: {
      type: Number,
      default: 365,
      min: 30,
      max: 1095
    },
    apiEnabled: {
      type: Boolean,
      default: false
    },
    debugMode: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  // Ensure only one configuration document exists
  collection: 'configurations'
});

// Static method to get the single configuration
configurationSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    // Create default configuration if none exists
    config = await this.create({
      business: {
        name: 'SuperMart POS',
        address: '123 Main Street, City, State 12345',
        phone: '+1 (555) 123-4567',
        email: 'info@supermart.com',
        taxId: '12-3456789',
        currency: 'USD',
        timezone: 'America/New_York',
        fiscalYearStart: 'January'
      },
      pos: {
        defaultCustomer: 'Walk-in',
        defaultPayment: 'cash',
        allowPriceOverride: true,
        requireReasonForReturn: true,
        autoPrintReceipt: false,
        showStockInCart: true,
        enableMultiWarehouse: false,
        barcodeScanner: true
      },
      tax: {
        enabled: true,
        defaultRate: 8.5,
        inclusivePricing: false,
        rates: [
          { id: 1, name: 'Standard', rate: 8.5, products: 'all' },
          { id: 2, name: 'Reduced', rate: 5.0, products: 'essential' },
          { id: 3, name: 'Zero', rate: 0, products: 'exempt' }
        ]
      },
      payments: {
        methods: [
          { id: 1, name: 'Cash', enabled: true, processor: 'manual' },
          { id: 2, name: 'Credit Card', enabled: true, processor: 'stripe' },
          { id: 3, name: 'Debit Card', enabled: true, processor: 'stripe' },
          { id: 4, name: 'Mobile Pay', enabled: false, processor: 'square' },
          { id: 5, name: 'Gift Card', enabled: true, processor: 'internal' }
        ]
      },
      printers: {
        receipt: { enabled: true, name: 'EPSON TM-T20', paperSize: '80mm', copies: 1 },
        kitchen: { enabled: false, name: '', paperSize: '80mm', copies: 1 },
        invoice: { enabled: false, name: '', paperSize: 'A4', copies: 1 }
      },
      backup: {
        autoBackup: true,
        frequency: 'daily',
        time: '02:00',
        location: 'local',
        cloudService: 'google_drive',
        keepBackups: 30
      },
      advanced: {
        sessionTimeout: 30,
        maxDiscount: 25,
        lowStockThreshold: 10,
        enableAuditLog: true,
        dataRetention: 365,
        apiEnabled: false,
        debugMode: false
      }
    });
  }
  return config;
};

module.exports = mongoose.model('Configuration', configurationSchema);
