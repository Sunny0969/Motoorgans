const express = require('express');
const router = express.Router();
const { getPSDetail } = require('../controllers/psDetailController');

router.get('/', getPSDetail);

module.exports = router;
