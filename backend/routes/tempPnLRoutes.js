const express = require('express');
const router = express.Router();
const { getTempPnL } = require('../controllers/tempPnLController');

router.get('/', getTempPnL);

module.exports = router;
