const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  searchEmployees,
  getEmployeesByDepartment,
  getEmployeesByStatus
} = require('../controllers/employeeController');

// Routes
router.route('/').get(getEmployees).post(createEmployee);
router.route('/:id').get(getEmployee).put(updateEmployee).delete(deleteEmployee);
router.route('/search/:query').get(searchEmployees);
router.route('/department/:department').get(getEmployeesByDepartment);
router.route('/status/:status').get(getEmployeesByStatus);

module.exports = router;
