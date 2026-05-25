const http = require('http');
const express = require('express');
const cors = require('cors');
const { initializeDatabase, testConnection, closeDB } = require('./config/database');

const app = express();
const HOST = process.env.HOST || '127.0.0.1';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const initializeApp = async () => {
  console.log('Initializing database...');

  const sqlPool = await initializeDatabase();
  app.locals.db = sqlPool;
  app.locals.dbInfo = await testConnection();

  console.log('Database initialized successfully!');
  return app;
};

const setupRoutes = () => {
  app.get('/api/health', (req, res) => {
    const connected = Boolean(app.locals.db && app.locals.db.connected);
    res.json({
      status: 'OK',
      message: 'Trade Office Management Backend is running',
      database: connected ? 'Connected' : 'Disconnected',
      engine: 'SQL Server',
      modules: [
        '/api/temp-acbal',
        '/api/temp-ledger',
        '/api/temp-stock',
        '/api/temp-pnl',
        '/api/ledger',
        '/api/products',
        '/api/customers',
        '/api/stock',
        '/api/companies',
      ],
    });
  });

  app.get('/api/db-status', async (req, res) => {
    try {
      if (app.locals.db && app.locals.db.connected) {
        const dbInfo = await testConnection();
        res.json({
          status: 'Connected',
          server: dbInfo.serverName,
          database: dbInfo.databaseName,
          version: dbInfo.version,
          edition: dbInfo.edition,
        });
      } else {
        res.status(500).json({ status: 'Disconnected', error: 'Database not initialized' });
      }
    } catch (error) {
      res.status(500).json({ status: 'Error', error: error.message });
    }
  });

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
  app.use('/api/stock', require('./routes/stockRoutes'));
  app.use('/api/product-history', require('./routes/productHistoryRoutes'));
  app.use('/api/ps-detail', require('./routes/psDetailRoutes'));
  app.use('/api/ledger', require('./routes/ledgerRoutes'));
  app.use('/api/temp-acbal', require('./routes/tempAcBalRoutes'));
  app.use('/api/temp-ledger', require('./routes/tempLedgerRoutes'));
  app.use('/api/temp-stock', require('./routes/tempStockRoutes'));
  app.use('/api/temp-pnl', require('./routes/tempPnLRoutes'));
  app.use('/api/companies', require('./routes/companyRoutes'));
  console.log('  ✓ TMS modules: /api/temp-acbal, /api/temp-ledger, /api/temp-stock, /api/temp-pnl, /api/companies');
  app.use('/api/sales-invoice', require('./routes/salesInvoiceRoutes'));
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
  app.use('/api/user-permissions', require('./routes/userPermissionRoutes'));

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      error: 'Something went wrong!',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.path });
  });
};

let httpServer = null;

const verifyOurServer = async (port) => {
  const response = await fetch(`http://${HOST}:${port}/api/health`);
  const data = await response.json();
  if (data.message !== 'Trade Office Management Backend is running') {
    throw new Error(
      `Port ${port} on ${HOST} is used by another app (not TMS backend). Change PORT in backend/.env`
    );
  }
};

const startServer = async () => {
  await initializeApp();
  setupRoutes();

  const PORT = Number(process.env.PORT) || 3010;

  httpServer = http.createServer(app);

  await new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(PORT, HOST, () => {
      httpServer.removeListener('error', reject);
      resolve();
    });
  });

  await verifyOurServer(PORT);

  const dbName = app.locals.dbInfo?.databaseName || 'Unknown';
  const dbServer = app.locals.dbInfo?.serverName || 'Unknown';

  console.log(`✅ TMS Backend running at http://${HOST}:${PORT}`);
  console.log(`📊 Database: SQL Server (${dbName} @ ${dbServer})`);
  console.log(`🌐 Health: http://${HOST}:${PORT}/api/health`);
  console.log(`📦 Products: http://${HOST}:${PORT}/api/products`);
  console.log('Keep this terminal open. Press Ctrl+C to stop.');

  await new Promise((resolve) => httpServer.on('close', resolve));
};

const shutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down...`);
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
    console.log('HTTP server closed');
  }
  await closeDB();
  console.log('SQL Server connection closed');
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

if (require.main === module) {
  if (process.stdin.isTTY) {
    process.stdin.resume();
  }

  startServer().catch((error) => {
    if (error.code === 'EADDRINUSE') {
      const port = Number(process.env.PORT) || 3010;
      console.error(`❌ Port ${port} on ${HOST} is already in use.`);
      console.error(`   Run: netstat -ano | findstr :${port}`);
      console.error('   Then stop that PID in Task Manager, or set PORT=3011 in backend/.env');
    } else {
      console.error('❌ Failed to start server:', error.message);
    }
    process.exit(1);
  });
}

module.exports = app;
