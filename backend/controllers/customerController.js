const { fetchCustomerDetails } = require('../services/tmsModulesService');
const { fetchCoaAccountById } = require('../utils/mssqlRepository');

const getCustomers = async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = req.query.limit ? Number(req.query.limit) : 5000;
    const customers = await fetchCustomerDetails(search, limit);
    res.json(customers);
  } catch (error) {
    console.error('GET /api/customers error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getCustomer = async (req, res) => {
  try {
    const customer = await fetchCoaAccountById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCustomer = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

const updateCustomer = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

const deleteCustomer = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

const searchCustomers = async (req, res) => {
  try {
    const customers = await fetchCustomerDetails(req.params.query, 100);
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
  searchCustomers,
};
