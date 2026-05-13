const Supplier = require('../models/Supplier');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Public
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Public
const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Public
const createSupplier = async (req, res) => {
  try {
    const { code, name, address, phone, email, creditDays } = req.body;

    const supplier = new Supplier({
      code,
      name,
      address,
      phone,
      email,
      creditDays
    });

    const createdSupplier = await supplier.save();
    res.status(201).json(createdSupplier);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Supplier code already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Public
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const { code, name, address, phone, email, creditDays, balance, isActive } = req.body;

    supplier.code = code || supplier.code;
    supplier.name = name || supplier.name;
    supplier.address = address || supplier.address;
    supplier.phone = phone || supplier.phone;
    supplier.email = email || supplier.email;
    supplier.creditDays = creditDays !== undefined ? creditDays : supplier.creditDays;
    supplier.balance = balance !== undefined ? balance : supplier.balance;
    supplier.isActive = isActive !== undefined ? isActive : supplier.isActive;

    const updatedSupplier = await supplier.save();
    res.json(updatedSupplier);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Supplier code already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Public
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    supplier.isActive = false;
    await supplier.save();
    res.json({ message: 'Supplier deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search suppliers
// @route   GET /api/suppliers/search/:query
// @access  Public
const searchSuppliers = async (req, res) => {
  try {
    const query = req.params.query;
    const suppliers = await Supplier.find({
      isActive: true,
      $or: [
        { code: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
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
  searchSuppliers
};
