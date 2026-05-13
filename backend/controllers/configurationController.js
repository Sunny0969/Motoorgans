const Configuration = require('../models/Configuration');

// @desc    Get configuration
// @route   GET /api/configuration
// @access  Public
const getConfiguration = async (req, res) => {
  try {
    const config = await Configuration.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update configuration
// @route   PUT /api/configuration
// @access  Public
const updateConfiguration = async (req, res) => {
  try {
    const config = await Configuration.getConfig();

    // Update the configuration with the provided data
    Object.keys(req.body).forEach(section => {
      if (config[section] && typeof req.body[section] === 'object') {
        Object.keys(req.body[section]).forEach(field => {
          config[section][field] = req.body[section][field];
        });
      } else {
        config[section] = req.body[section];
      }
    });

    const updatedConfig = await config.save();
    res.json(updatedConfig);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset configuration to defaults
// @route   POST /api/configuration/reset
// @access  Public
const resetConfiguration = async (req, res) => {
  try {
    const config = await Configuration.getConfig();

    // Reset to default values
    config.business = {
      name: 'SuperMart POS',
      address: '123 Main Street, City, State 12345',
      phone: '+1 (555) 123-4567',
      email: 'info@supermart.com',
      taxId: '12-3456789',
      currency: 'USD',
      timezone: 'America/New_York',
      fiscalYearStart: 'January'
    };

    config.pos = {
      defaultCustomer: 'Walk-in',
      defaultPayment: 'cash',
      allowPriceOverride: false,
      requireReasonForReturn: true,
      autoPrintReceipt: false,
      showStockInCart: true,
      enableMultiWarehouse: false,
      barcodeScanner: true
    };

    config.tax = {
      enabled: true,
      defaultRate: 8.5,
      inclusivePricing: false,
      rates: [
        { id: 1, name: 'Standard', rate: 8.5, products: 'all' },
        { id: 2, name: 'Reduced', rate: 5.0, products: 'essential' },
        { id: 3, name: 'Zero', rate: 0, products: 'exempt' }
      ]
    };

    config.payments = {
      methods: [
        { id: 1, name: 'Cash', enabled: true, processor: 'manual' },
        { id: 2, name: 'Credit Card', enabled: true, processor: 'stripe' },
        { id: 3, name: 'Debit Card', enabled: true, processor: 'stripe' },
        { id: 4, name: 'Mobile Pay', enabled: false, processor: 'square' },
        { id: 5, name: 'Gift Card', enabled: true, processor: 'internal' }
      ]
    };

    config.printers = {
      receipt: { enabled: true, name: 'EPSON TM-T20', paperSize: '80mm', copies: 1 },
      kitchen: { enabled: false, name: '', paperSize: '80mm', copies: 1 },
      invoice: { enabled: false, name: '', paperSize: 'A4', copies: 1 }
    };

    config.backup = {
      autoBackup: true,
      frequency: 'daily',
      time: '02:00',
      location: 'local',
      cloudService: 'google_drive',
      keepBackups: 30
    };

    config.advanced = {
      sessionTimeout: 30,
      maxDiscount: 25,
      lowStockThreshold: 10,
      enableAuditLog: true,
      dataRetention: 365,
      apiEnabled: false,
      debugMode: false
    };

    const resetConfig = await config.save();
    res.json(resetConfig);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Test printer connection
// @route   POST /api/configuration/test-printer/:type
// @access  Public
const testPrinter = async (req, res) => {
  try {
    const { type } = req.params;
    const config = await Configuration.getConfig();

    if (!config.printers[type] || !config.printers[type].enabled) {
      return res.status(400).json({ message: 'Printer not configured or disabled' });
    }

    // In a real implementation, you would test the actual printer connection
    // For now, we'll simulate a successful test
    setTimeout(() => {
      res.json({
        success: true,
        message: `Test print sent to ${config.printers[type].name}`,
        timestamp: new Date().toISOString()
      });
    }, 1500);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Test barcode scanner
// @route   POST /api/configuration/test-barcode
// @access  Public
const testBarcodeScanner = async (req, res) => {
  try {
    const config = await Configuration.getConfig();

    if (!config.pos.barcodeScanner) {
      return res.status(400).json({ message: 'Barcode scanner is disabled' });
    }

    // In a real implementation, you would listen for barcode scanner input
    // For now, we'll simulate waiting for input
    setTimeout(() => {
      res.json({
        success: false,
        message: 'No barcode detected. Please check scanner connection.',
        timestamp: new Date().toISOString()
      });
    }, 3000);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Run backup
// @route   POST /api/configuration/backup
// @access  Public
const runBackup = async (req, res) => {
  try {
    // In a real implementation, you would perform the actual backup
    // For now, we'll simulate the backup process
    setTimeout(() => {
      const backupTime = new Date().toLocaleString();
      res.json({
        success: true,
        message: `Backup completed successfully at ${backupTime}`,
        timestamp: backupTime,
        size: '2.5 MB'
      });
    }, 2000);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear transaction data
// @route   DELETE /api/configuration/clear-data
// @access  Public
const clearTransactionData = async (req, res) => {
  try {
    // In a real implementation, you would clear the transaction data
    // This is a dangerous operation that should be carefully implemented
    res.status(501).json({
      message: 'Data clearing functionality not implemented yet. This is a dangerous operation.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConfiguration,
  updateConfiguration,
  resetConfiguration,
  testPrinter,
  testBarcodeScanner,
  runBackup,
  clearTransactionData
};
