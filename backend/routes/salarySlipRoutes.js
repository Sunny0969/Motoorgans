const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  getNextNumber,
  getList,
  getById,
  createSlip,
  updateSlip,
  deleteSlip,
} = require('../controllers/salarySlipController');

router.get('/next-id', getNextNumber);
router.get('/employees', getEmployees);
router.get('/employees/:id', getEmployee);
router.get('/list', getList);

router.route('/')
  .post(createSlip);

router.route('/:id')
  .get(getById)
  .put(updateSlip)
  .delete(deleteSlip);

module.exports = router;
