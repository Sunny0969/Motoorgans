const express = require('express');
const router = express.Router();
const {
  login,
  getProfile,
  changePassword,
  logout,
  createAdmin
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/create-admin', createAdmin); // Remove in production

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;
