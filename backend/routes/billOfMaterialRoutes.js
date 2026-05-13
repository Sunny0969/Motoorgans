const express = require('express');
const router = express.Router();
const {
  getAllBOM,
  getBOMById,
  createBOM,
  updateBOM,
  deleteBOM,
  getBOMByCategory,
  searchBOM
} = require('../controllers/billOfMaterialController');

// GET /api/bom - Get all BOM items
router.get('/', getAllBOM);

// GET /api/bom/search - Search BOM items
router.get('/search', searchBOM);

// GET /api/bom/category/:category - Get BOM items by category
router.get('/category/:category', getBOMByCategory);

// GET /api/bom/:id - Get BOM item by ID
router.get('/:id', getBOMById);

// POST /api/bom - Create new BOM item
router.post('/', createBOM);

// PUT /api/bom/:id - Update BOM item
router.put('/:id', updateBOM);

// DELETE /api/bom/:id - Delete BOM item
router.delete('/:id', deleteBOM);

module.exports = router;
