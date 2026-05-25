const express = require('express');
const router = express.Router();
const { getTempLedger } = require('../controllers/tempLedgerController');

router.get('/', getTempLedger);

module.exports = router;
