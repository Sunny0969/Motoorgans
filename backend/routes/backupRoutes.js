const express = require('express');
const router = express.Router();
const { createBackup, getBackups } = require('../controllers/backupController');

router.get('/', getBackups);
router.post('/', createBackup);

module.exports = router;
