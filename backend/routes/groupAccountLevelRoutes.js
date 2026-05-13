const express = require('express');
const router = express.Router();
const {
  getAllGroupAccountLevels,
  getGroupAccountLevelById,
  createGroupAccountLevel,
  updateGroupAccountLevel,
  deleteGroupAccountLevel,
  getParentGroups,
  getLevels
} = require('../controllers/groupAccountLevelController');

// GET /api/group-account-levels - Get all group account levels with optional filters
router.get('/', getAllGroupAccountLevels);

// GET /api/group-account-levels/parent-groups - Get distinct parent groups
router.get('/parent-groups', getParentGroups);

// GET /api/group-account-levels/levels - Get distinct levels
router.get('/levels', getLevels);

// GET /api/group-account-levels/:id - Get single group account level
router.get('/:id', getGroupAccountLevelById);

// POST /api/group-account-levels - Create new group account level
router.post('/', createGroupAccountLevel);

// PUT /api/group-account-levels/:id - Update group account level
router.put('/:id', updateGroupAccountLevel);

// DELETE /api/group-account-levels/:id - Delete group account level
router.delete('/:id', deleteGroupAccountLevel);

module.exports = router;
