const {
  fetchSuppliers,
  fetchSupplierById,
  searchSuppliers,
} = require('../utils/mssqlRepository');

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await fetchSuppliers();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSupplier = async (req, res) => {
  try {
    const supplier = await fetchSupplierById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSupplier = async (req, res) => {
  res.status(501).json({ message: 'Create supplier is not implemented for SQL Server yet.' });
};

const updateSupplier = async (req, res) => {
  res.status(501).json({ message: 'Update supplier is not implemented for SQL Server yet.' });
};

const deleteSupplier = async (req, res) => {
  res.status(501).json({ message: 'Delete supplier is not implemented for SQL Server yet.' });
};

const searchSuppliersHandler = async (req, res) => {
  try {
    const suppliers = await searchSuppliers(req.params.query);
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  searchSuppliers: searchSuppliersHandler,
};
