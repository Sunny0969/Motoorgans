const BankPayment = require('../models/BankPayment');

// @desc    Get all bank payments
// @route   GET /api/bankpayments
// @access  Public
const getBankPayments = async (req, res) => {
  try {
    const bankPayments = await BankPayment.find().sort({ createdAt: -1 });
    res.json(bankPayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single bank payment
// @route   GET /api/bankpayments/:id
// @access  Public
const getBankPayment = async (req, res) => {
  try {
    const bankPayment = await BankPayment.findById(req.params.id);
    if (!bankPayment) {
      return res.status(404).json({ message: 'Bank payment not found' });
    }
    res.json(bankPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create bank payment
// @route   POST /api/bankpayments
// @access  Public
const createBankPayment = async (req, res) => {
  try {
    const {
      paymentNumber,
      date,
      paymentDate,
      paidTo,
      reference,
      bankAccount,
      paymentMethod,
      chequeNumber,
      amount,
      currency,
      status,
      preparedBy,
      notes,
      allocations,
      summary
    } = req.body;

    const bankPayment = new BankPayment({
      paymentNumber,
      date: new Date(date),
      paymentDate: new Date(paymentDate),
      paidTo,
      reference,
      bankAccount,
      paymentMethod,
      chequeNumber,
      amount: parseFloat(amount),
      currency,
      status: status || 'Draft',
      preparedBy,
      notes,
      allocations: allocations || [],
      summary: summary || { totalAllocated: 0, remainingAmount: 0 }
    });

    const createdBankPayment = await bankPayment.save();
    res.status(201).json(createdBankPayment);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Payment number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update bank payment
// @route   PUT /api/bankpayments/:id
// @access  Public
const updateBankPayment = async (req, res) => {
  try {
    const bankPayment = await BankPayment.findById(req.params.id);
    if (!bankPayment) {
      return res.status(404).json({ message: 'Bank payment not found' });
    }

    const {
      paymentNumber,
      date,
      paymentDate,
      paidTo,
      reference,
      bankAccount,
      paymentMethod,
      chequeNumber,
      amount,
      currency,
      status,
      preparedBy,
      notes,
      allocations,
      summary
    } = req.body;

    bankPayment.paymentNumber = paymentNumber || bankPayment.paymentNumber;
    bankPayment.date = date ? new Date(date) : bankPayment.date;
    bankPayment.paymentDate = paymentDate ? new Date(paymentDate) : bankPayment.paymentDate;
    bankPayment.paidTo = paidTo || bankPayment.paidTo;
    bankPayment.reference = reference || bankPayment.reference;
    bankPayment.bankAccount = bankAccount || bankPayment.bankAccount;
    bankPayment.paymentMethod = paymentMethod || bankPayment.paymentMethod;
    bankPayment.chequeNumber = chequeNumber || bankPayment.chequeNumber;
    bankPayment.amount = amount !== undefined ? parseFloat(amount) : bankPayment.amount;
    bankPayment.currency = currency || bankPayment.currency;
    bankPayment.status = status || bankPayment.status;
    bankPayment.preparedBy = preparedBy || bankPayment.preparedBy;
    bankPayment.notes = notes || bankPayment.notes;
    bankPayment.allocations = allocations || bankPayment.allocations;
    bankPayment.summary = summary || bankPayment.summary;

    const updatedBankPayment = await bankPayment.save();
    res.json(updatedBankPayment);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Payment number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete bank payment
// @route   DELETE /api/bankpayments/:id
// @access  Public
const deleteBankPayment = async (req, res) => {
  try {
    const bankPayment = await BankPayment.findById(req.params.id);
    if (!bankPayment) {
      return res.status(404).json({ message: 'Bank payment not found' });
    }

    await BankPayment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bank payment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search bank payments
// @route   GET /api/bankpayments/search/:query
// @access  Public
const searchBankPayments = async (req, res) => {
  try {
    const query = req.params.query;
    const bankPayments = await BankPayment.find({
      $or: [
        { paymentNumber: { $regex: query, $options: 'i' } },
        { paidTo: { $regex: query, $options: 'i' } },
        { bankAccount: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    res.json(bankPayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBankPayments,
  getBankPayment,
  createBankPayment,
  updateBankPayment,
  deleteBankPayment,
  searchBankPayments
};
