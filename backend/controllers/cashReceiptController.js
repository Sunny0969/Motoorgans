const CashReceipt = require('../models/CashReceipt');

// @desc    Get all cash receipts
// @route   GET /api/cashreceipts
// @access  Public
const getCashReceipts = async (req, res) => {
  try {
    const cashReceipts = await CashReceipt.find().sort({ createdAt: -1 });
    res.json(cashReceipts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single cash receipt
// @route   GET /api/cashreceipts/:id
// @access  Public
const getCashReceipt = async (req, res) => {
  try {
    const cashReceipt = await CashReceipt.findById(req.params.id);
    if (!cashReceipt) {
      return res.status(404).json({ message: 'Cash receipt not found' });
    }
    res.json(cashReceipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create cash receipt
// @route   POST /api/cashreceipts
// @access  Public
const createCashReceipt = async (req, res) => {
  try {
    const { crvNumber, date, code, accountTitle, description, invoice, discount, amount, address } = req.body;

    const cashReceipt = new CashReceipt({
      crvNumber,
      date: new Date(date),
      code,
      accountTitle,
      description,
      invoice,
      discount: parseFloat(discount) || 0,
      amount: parseFloat(amount),
      address
    });

    const createdCashReceipt = await cashReceipt.save();
    res.status(201).json(createdCashReceipt);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'CRV number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update cash receipt
// @route   PUT /api/cashreceipts/:id
// @access  Public
const updateCashReceipt = async (req, res) => {
  try {
    const cashReceipt = await CashReceipt.findById(req.params.id);
    if (!cashReceipt) {
      return res.status(404).json({ message: 'Cash receipt not found' });
    }

    const { crvNumber, date, code, accountTitle, description, invoice, discount, amount, address, status } = req.body;

    cashReceipt.crvNumber = crvNumber || cashReceipt.crvNumber;
    cashReceipt.date = date ? new Date(date) : cashReceipt.date;
    cashReceipt.code = code || cashReceipt.code;
    cashReceipt.accountTitle = accountTitle || cashReceipt.accountTitle;
    cashReceipt.description = description || cashReceipt.description;
    cashReceipt.invoice = invoice || cashReceipt.invoice;
    cashReceipt.discount = discount !== undefined ? parseFloat(discount) : cashReceipt.discount;
    cashReceipt.amount = amount !== undefined ? parseFloat(amount) : cashReceipt.amount;
    cashReceipt.address = address || cashReceipt.address;
    cashReceipt.status = status || cashReceipt.status;

    const updatedCashReceipt = await cashReceipt.save();
    res.json(updatedCashReceipt);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'CRV number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete cash receipt
// @route   DELETE /api/cashreceipts/:id
// @access  Public
const deleteCashReceipt = async (req, res) => {
  try {
    const cashReceipt = await CashReceipt.findById(req.params.id);
    if (!cashReceipt) {
      return res.status(404).json({ message: 'Cash receipt not found' });
    }

    await CashReceipt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cash receipt deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search cash receipts
// @route   GET /api/cashreceipts/search/:query
// @access  Public
const searchCashReceipts = async (req, res) => {
  try {
    const query = req.params.query;
    const cashReceipts = await CashReceipt.find({
      $or: [
        { crvNumber: { $regex: query, $options: 'i' } },
        { accountTitle: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    res.json(cashReceipts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCashReceipts,
  getCashReceipt,
  createCashReceipt,
  updateCashReceipt,
  deleteCashReceipt,
  searchCashReceipts
};
