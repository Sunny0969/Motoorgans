const {
  fetchEmployeesForSalary,
  fetchEmployeeById,
  getNextSlipId,
  fetchSalarySlipsList,
  fetchSalarySlipBySlipNo,
  fetchSalarySlipByRecordKey,
  saveSalarySlip,
  deleteSalarySlip,
} = require('../services/salarySlipService');

const getEmployees = async (req, res) => {
  try {
    const data = await fetchEmployeesForSalary();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEmployee = async (req, res) => {
  try {
    const data = await fetchEmployeeById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getNextNumber = async (req, res) => {
  try {
    const nextId = await getNextSlipId();
    res.json({ nextId, slipId: nextId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getList = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const data = await fetchSalarySlipsList(limit);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const param = req.params.id;
    let data = await fetchSalarySlipBySlipNo(param);
    if (!data && param.includes('-')) {
      data = await fetchSalarySlipByRecordKey(param);
    }
    if (!data) {
      return res.status(404).json({ success: false, message: 'Salary slip not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSlip = async (req, res) => {
  try {
    const saved = await saveSalarySlip(req.body, null);
    res.status(201).json({
      success: true,
      message: `Salary slip #${saved.slipId} saved successfully.`,
      data: saved,
    });
  } catch (error) {
    console.error('POST /api/salary-slips error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSlip = async (req, res) => {
  try {
    const key = req.body.recordKey || req.params.id;
    const saved = await saveSalarySlip(req.body, key);
    res.json({
      success: true,
      message: `Salary slip #${saved.slipId} updated successfully.`,
      data: saved,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSlip = async (req, res) => {
  try {
    const key = req.query.recordKey || req.params.id;
    await deleteSalarySlip(key);
    res.json({ success: true, message: 'Salary slip deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  getNextNumber,
  getList,
  getById,
  createSlip,
  updateSlip,
  deleteSlip,
};
