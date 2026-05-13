const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Public
const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Public
const createCustomer = async (req, res) => {
  try {
    const { code, name, address, phone, email, creditDays, balance } = req.body;

    const customer = new Customer({
      code,
      name,
      address,
      phone,
      email,
      creditDays,
      balance
    });

    const createdCustomer = await customer.save();
    res.status(201).json(createdCustomer);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Customer code already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const { code, name, address, phone, email, creditDays, balance, isActive } = req.body;

    customer.code = code || customer.code;
    customer.name = name || customer.name;
    customer.address = address || customer.address;
    customer.phone = phone || customer.phone;
    customer.email = email || customer.email;
    customer.creditDays = creditDays !== undefined ? creditDays : customer.creditDays;
    customer.balance = balance !== undefined ? balance : customer.balance;
    customer.isActive = isActive !== undefined ? isActive : customer.isActive;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Customer code already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search customers
// @route   GET /api/customers/search/:query
// @access  Public
const searchCustomers = async (req, res) => {
  try {
    const query = req.params.query;
    const customers = await Customer.find({
      isActive: true,
      $or: [
        { code: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
};
