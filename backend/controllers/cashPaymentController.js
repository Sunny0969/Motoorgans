const CashPayment = require('../models/CashPayment');

// @desc    Get all cash payments
// @route   GET /api/cashpayments
// @access  Public
const getCashPayments = async (req, res) => {
  try {
    const cashPayments = await CashPayment.find().sort({ createdAt: -1 });
    res.json(cashPayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single cash payment
// @route   GET /api/cashpayments/:id
// @access  Public
const getCashPayment = async (req, res) => {
  try {
    const cashPayment = await CashPayment.findById(req.params.id);
    if (!cashPayment) {
      return res.status(404).json({ message: 'Cash payment not found' });
    }
    res.json(cashPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create cash payment
// @route   POST /api/cashpayments
// @access  Public
const createCashPayment = async (req, res) => {
  try {
    const { cpvNumber, date, code, accountTitle, description, invoice, amount } = req.body;

    const cashPayment = new CashPayment({
      cpvNumber,
      date: new Date(date),
      code,
      accountTitle,
      description,
      invoice,
      amount: parseFloat(amount)
    });

    const createdCashPayment = await cashPayment.save();
    res.status(201).json(createdCashPayment);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'CPV number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update cash payment
// @route   PUT /api/cashpayments/:id
// @access  Public
const updateCashPayment = async (req, res) => {
  try {
    const cashPayment = await CashPayment.findById(req.params.id);
    if (!cashPayment) {
      return res.status(404).json({ message: 'Cash payment not found' });
    }

    const { cpvNumber, date, code, accountTitle, description, invoice, amount, status } = req.body;

    cashPayment.cpvNumber = cpvNumber || cashPayment.cpvNumber;
    cashPayment.date = date ? new Date(date) : cashPayment.date;
    cashPayment.code = code || cashPayment.code;
    cashPayment.accountTitle = accountTitle || cashPayment.accountTitle;
    cashPayment.description = description || cashPayment.description;
    cashPayment.invoice = invoice || cashPayment.invoice;
    cashPayment.amount = amount !== undefined ? parseFloat(amount) : cashPayment.amount;
    cashPayment.status = status || cashPayment.status;

    const updatedCashPayment = await cashPayment.save();
    res.json(updatedCashPayment);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'CPV number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete cash payment
// @route   DELETE /api/cashpayments/:id
// @access  Public
const deleteCashPayment = async (req, res) => {
  try {
    const cashPayment = await CashPayment.findById(req.params.id);
    if (!cashPayment) {
      return res.status(404).json({ message: 'Cash payment not found' });
    }

    await CashPayment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cash payment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search cash payments
// @route   GET /api/cashpayments/search/:query
// @access  Public
const searchCashPayments = async (req, res) => {
  try {
    const query = req.params.query;
    const cashPayments = await CashPayment.find({
      $or: [
        { cpvNumber: { $regex: query, $options: 'i' } },
        { accountTitle: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    res.json(cashPayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCashPayments,
  getCashPayment,
  createCashPayment,
  updateCashPayment,
  deleteCashPayment,
  searchCashPayments
};
