const express = require('express');
const router = express.Router();
const { getLedger } = require('../controllers/ledgerController');

router.get('/', getLedger);

module.exports = router;
