const Employee = require('../models/Employee');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Public
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({}).sort({ employeeId: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Public
const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Public
const createEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      firstName,
      lastName,
      department,
      position,
      email,
      phone,
      hireDate,
      salary,
      status,
      location
    } = req.body;

    const employee = new Employee({
      employeeId,
      firstName,
      lastName,
      department,
      position,
      email,
      phone,
      hireDate,
      salary,
      status,
      location
    });

    const createdEmployee = await employee.save();
    res.status(201).json(createdEmployee);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Employee ID already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Public
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const {
      employeeId,
      firstName,
      lastName,
      department,
      position,
      email,
      phone,
      hireDate,
      salary,
      status,
      location
    } = req.body;

    employee.employeeId = employeeId || employee.employeeId;
    employee.firstName = firstName || employee.firstName;
    employee.lastName = lastName || employee.lastName;
    employee.department = department || employee.department;
    employee.position = position || employee.position;
    employee.email = email || employee.email;
    employee.phone = phone || employee.phone;
    employee.hireDate = hireDate || employee.hireDate;
    employee.salary = salary !== undefined ? salary : employee.salary;
    employee.status = status || employee.status;
    employee.location = location || employee.location;

    const updatedEmployee = await employee.save();
    res.json(updatedEmployee);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Employee ID already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Public
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search employees
// @route   GET /api/employees/search/:query
// @access  Public
const searchEmployees = async (req, res) => {
  try {
    const query = req.params.query;
    const employees = await Employee.find({
      $or: [
        { employeeId: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
        { position: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employees by department
// @route   GET /api/employees/department/:department
// @access  Public
const getEmployeesByDepartment = async (req, res) => {
  try {
    const employees = await Employee.find({
      department: req.params.department
    }).sort({ employeeId: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employees by status
// @route   GET /api/employees/status/:status
// @access  Public
const getEmployeesByStatus = async (req, res) => {
  try {
    const employees = await Employee.find({
      status: req.params.status
    }).sort({ employeeId: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  searchEmployees,
  getEmployeesByDepartment,
  getEmployeesByStatus
};
