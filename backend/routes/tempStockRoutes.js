const express = require('express');
const router = express.Router();
const { getTempStock } = require('../controllers/tempStockController');

router.get('/', getTempStock);

module.exports = router;
