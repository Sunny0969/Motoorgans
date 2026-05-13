const express = require('express');
const router = express.Router();
const {
  getRates,
  getRateById,
  createRate,
  updateRate,
  deleteRate
} = require('../controllers/rateController');

// GET /api/rates - Get all rates with optional filters
router.get('/', getRates);

// GET /api/rates/:id - Get single rate
router.get('/:id', getRateById);

// POST /api/rates - Create new rate
router.post('/', createRate);

// PUT /api/rates/:id - Update rate
router.put('/:id', updateRate);

// DELETE /api/rates/:id - Delete rate
router.delete('/:id', deleteRate);

module.exports = router;
