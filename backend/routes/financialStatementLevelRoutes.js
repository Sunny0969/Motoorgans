const express = require('express');
const router = express.Router();
const {
  getAllLevels,
  getLevelById,
  createLevel,
  updateLevel,
  deleteLevel
} = require('../controllers/financialStatementLevelController');

// Routes for financial statement levels
router.get('/', getAllLevels);
router.get('/:id', getLevelById);
router.post('/', createLevel);
router.put('/:id', updateLevel);
router.delete('/:id', deleteLevel);

module.exports = router;
