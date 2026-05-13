const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  getPermissionMatrix,
  resetUserPassword,
  toggleUserStatus,
  getUserStats
} = require('../controllers/userPermissionController');

// User routes
router.get('/users', getUsers);
router.get('/users/stats', getUserStats);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/password', resetUserPassword);

// Role routes
router.get('/roles', getRoles);
router.get('/roles/:id', getRoleById);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

// Permission routes
router.get('/permissions', getPermissions);
router.get('/permissions/matrix', getPermissionMatrix);

module.exports = router;
