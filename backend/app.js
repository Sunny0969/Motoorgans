const express = require('express');
const cors = require('cors');
const { initializeDatabase, testConnection, closeDB } = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database initialization function
const initializeApp = async () => {
  try {
    console.log('Initializing database...');
    
    const sqlPool = await initializeDatabase();
    app.locals.db = sqlPool;
    
    // Test connection and cache server info for startup logs
    app.locals.dbInfo = await testConnection();
    
    console.log('Database initialized successfully!');
    
    return app;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Routes (database initialized hone ke baad setup honge)
const setupRoutes = () => {
  // Routes
  app.use('/api/suppliers', require('./routes/supplierRoutes'));
  app.use('/api/products', require('./routes/productRoutes'));
  app.use('/api/purchases', require('./routes/purchaseRoutes'));
  app.use('/api/sales', require('./routes/saleRoutes'));
  app.use('/api/accounts', require('./routes/accountRoutes'));
  app.use('/api/employees', require('./routes/employeeRoutes'));
  app.use('/api/vouchers', require('./routes/voucherRoutes'));
  app.use('/api/cashpayments', require('./routes/cashPaymentRoutes'));
  app.use('/api/cashreceipts', require('./routes/cashReceiptRoutes'));
  app.use('/api/bankpayments', require('./routes/bankPaymentRoutes'));
  app.use('/api/bankreceipts', require('./routes/bankReceiptRoutes'));
  app.use('/api/reports', require('./routes/reportRoutes'));
  app.use('/api/rates', require('./routes/rateRoutes'));
  app.use('/api/bom', require('./routes/billOfMaterialRoutes'));
  app.use('/api/customers', require('./routes/customerRoutes'));
  app.use('/api/sms', require('./routes/smsRoutes'));
  app.use('/api/font-settings', require('./routes/fontSettingsRoutes'));
  app.use('/api/locations', require('./routes/locationRoutes'));
  app.use('/api/cheque-transfers', require('./routes/chequeTransferRoutes'));
  app.use('/api/claims-in-from-customer', require('./routes/claimInFromCustomerRoutes'));
  app.use('/api/claims-out-to-supplier', require('./routes/claimOutToSupplierRoutes'));
  app.use('/api/transaction-classes', require('./routes/transactionClassRoutes'));
  app.use('/api/contact-groups', require('./routes/contactGroupRoutes'));
  app.use('/api/sale-orders', require('./routes/saleOrderRoutes'));
  app.use('/api/day-close', require('./routes/dayCloseRoutes'));
  app.use('/api/demand-orders', require('./routes/demandOrderRoutes'));
  app.use('/api/event-logs', require('./routes/eventLogRoutes'));
  app.use('/api/expenses', require('./routes/expenseRoutes'));
  app.use('/api/monthly-transaction-reports', require('./routes/monthlyTransactionReportRoutes'));
  app.use('/api/payment-vouchers', require('./routes/paymentVoucherRoutes'));
  app.use('/api/productions', require('./routes/productionRoutes'));
  app.use('/api/stock-adjustments', require('./routes/stockAdjustmentRoutes'));
  app.use('/api/stock-management', require('./routes/stockManagementRoutes'));
  app.use('/api/stock-transfers', require('./routes/stockTransferRoutes'));
  app.use('/api/reports/trial-balance', require('./routes/trialBalanceRoutes'));
  app.use('/api/financial-statement-levels', require('./routes/financialStatementLevelRoutes'));
  app.use('/api/shops', require('./routes/shopRoutes'));
  
  // User permissions routes
  app.use('/api/user-permissions', require('./routes/userPermissionRoutes'));
  
  // Health check
  app.get('/api/health', (req, res) => {
    const connected = Boolean(app.locals.db && app.locals.db.connected);
    res.json({
      status: 'OK',
      message: 'Trade Office Management Backend is running',
      database: connected ? 'Connected' : 'Disconnected',
      engine: 'SQL Server'
    });
  });
  
  // Database connection check endpoint
  app.get('/api/db-status', async (req, res) => {
    try {
      if (app.locals.db && app.locals.db.connected) {
        const dbInfo = await testConnection();
        res.json({
          status: 'Connected',
          server: dbInfo.serverName,
          database: dbInfo.databaseName,
          version: dbInfo.version,
          edition: dbInfo.edition
        });
      } else {
        res.status(500).json({ status: 'Disconnected', error: 'Database not initialized' });
      }
    } catch (error) {
      res.status(500).json({ status: 'Error', error: error.message });
    }
  });
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
      error: 'Something went wrong!',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
};

// Start server function
const startServer = async () => {
  try {
    // Initialize database
    await initializeApp();
    
    // Setup routes (ab database connected hai)
    setupRoutes();
    
    const PORT = process.env.PORT || 5000;
    
    // Start server
    const server = app.listen(PORT, () => {
      const dbName = app.locals.dbInfo?.databaseName || 'Unknown';
      const dbServer = app.locals.dbInfo?.serverName || 'Unknown';
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📊 Database: SQL Server (${dbName} @ ${dbServer})`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 Database status: http://localhost:${PORT}/api/db-status`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        await closeDB();
        console.log('SQL Server connection closed');
      });
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;