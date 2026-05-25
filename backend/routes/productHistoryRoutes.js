const express = require('express');
const router = express.Router();
const { getProductHistory } = require('../controllers/productHistoryController');

router.get('/', getProductHistory);

module.exports = router;
