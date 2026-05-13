const express = require('express');
const router = express.Router();
const {
  getConfiguration,
  updateConfiguration,
  resetConfiguration,
  testPrinter,
  testBarcodeScanner,
  runBackup,
  clearTransactionData
} = require('../controllers/configurationController');

// Routes
router.route('/')
  .get(getConfiguration)
  .put(updateConfiguration);

router.route('/reset')
  .post(resetConfiguration);

router.route('/test-printer/:type')
  .post(testPrinter);

router.route('/test-barcode')
  .post(testBarcodeScanner);

router.route('/backup')
  .post(runBackup);

router.route('/clear-data')
  .delete(clearTransactionData);

module.exports = router;
