const express = require('express');
const router = express.Router();
const { getTempAcBal } = require('../controllers/tempAcBalController');

router.get('/', getTempAcBal);

module.exports = router;
