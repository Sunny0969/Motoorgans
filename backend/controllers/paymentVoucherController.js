const PaymentVoucher = require('../models/PaymentVoucher');

// @desc    Get all payment vouchers
// @route   GET /api/payment-vouchers
// @access  Public
const getAllPaymentVouchers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', paymentMethod = '' } = req.query;

    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { payee: { $regex: search, $options: 'i' } },
        { voucherNo: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // Payment method filter
    if (paymentMethod && paymentMethod !== 'All') {
      query.paymentMethod = paymentMethod;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const vouchers = await PaymentVoucher.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await PaymentVoucher.countDocuments(query);

    res.json({
      vouchers,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single payment voucher
// @route   GET /api/payment-vouchers/:id
// @access  Public
const getPaymentVoucherById = async (req, res) => {
  try {
    const voucher = await PaymentVoucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: 'Payment voucher not found' });
    }
    res.json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create payment voucher
// @route   POST /api/payment-vouchers
// @access  Public
const createPaymentVoucher = async (req, res) => {
  try {
    const voucherData = req.body;

    // Validate required fields
    const requiredFields = ['date', 'payee', 'account', 'amount', 'paymentMethod'];
    for (const field of requiredFields) {
      if (!voucherData[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Validate amount
    if (voucherData.amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const voucher = new PaymentVoucher(voucherData);
    const savedVoucher = await voucher.save();

    res.status(201).json(savedVoucher);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Voucher number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update payment voucher
// @route   PUT /api/payment-vouchers/:id
// @access  Public
const updatePaymentVoucher = async (req, res) => {
  try {
    const voucherData = req.body;

    // Validate amount if provided
    if (voucherData.amount !== undefined && voucherData.amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const voucher = await PaymentVoucher.findByIdAndUpdate(
      req.params.id,
      voucherData,
      { new: true, runValidators: true }
    );

    if (!voucher) {
      return res.status(404).json({ message: 'Payment voucher not found' });
    }

    res.json(voucher);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Voucher number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete payment voucher
// @route   DELETE /api/payment-vouchers/:id
// @access  Public
const deletePaymentVoucher = async (req, res) => {
  try {
    const voucher = await PaymentVoucher.findByIdAndDelete(req.params.id);

    if (!voucher) {
      return res.status(404).json({ message: 'Payment voucher not found' });
    }

    res.json({ message: 'Payment voucher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payment voucher statistics
// @route   GET /api/payment-vouchers/stats/summary
// @access  Public
const getPaymentVoucherStats = async (req, res) => {
  try {
    const totalVouchers = await PaymentVoucher.countDocuments();
    const totalAmount = await PaymentVoucher.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paidAmount = await PaymentVoucher.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingAmount = await PaymentVoucher.aggregate([
      { $match: { status: 'Pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const statusCounts = await PaymentVoucher.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const paymentMethodCounts = await PaymentVoucher.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
    ]);

    res.json({
      totalVouchers,
      totalAmount: totalAmount[0]?.total || 0,
      paidAmount: paidAmount[0]?.total || 0,
      pendingAmount: pendingAmount[0]?.total || 0,
      statusCounts,
      paymentMethodCounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllPaymentVouchers,
  getPaymentVoucherById,
  createPaymentVoucher,
  updatePaymentVoucher,
  deletePaymentVoucher,
  getPaymentVoucherStats
};
