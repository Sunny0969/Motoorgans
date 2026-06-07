const express = require('express');
const router = express.Router();
const { getCompanies, upsertCompanyColorHandler } = require('../controllers/companyController');

router.get('/', getCompanies);
router.put('/color', upsertCompanyColorHandler);

module.exports = router;
