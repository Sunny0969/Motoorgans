const express = require('express');
const router = express.Router();
const {
  getAllProductions,
  getProductionById,
  createProduction,
  updateProduction,
  deleteProduction,
  updateProductionStatus,
  getProductionStats
} = require('../controllers/productionController');

// Routes
router.route('/')
  .get(getAllProductions)
  .post(createProduction);

router.route('/:id')
  .get(getProductionById)
  .put(updateProduction)
  .delete(deleteProduction);

router.route('/:id/status')
  .put(updateProductionStatus);

router.route('/stats/summary')
  .get(getProductionStats);

module.exports = router;
