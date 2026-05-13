const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Public
const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().populate('supplier', 'code name').sort({ createdAt: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Public
const getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate('supplier', 'code name');
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create purchase
// @route   POST /api/purchases
// @access  Public
const createPurchase = async (req, res) => {
  try {
    const {
      invoiceNo,
      date,
      paymentType,
      supplier,
      creditDays,
      dueDate,
      products,
      previousBalance,
      cashPaid,
      discPercentFooter,
      extraDiscount,
      transporter,
      builtyNo,
      description,
      sendSMS,
      printPreBalance
    } = req.body;

    // Calculate totals
    let totalPcs = 0;
    let netAmount = 0;

    for (const product of products) {
      totalPcs += parseFloat(product.pcs) || 0;
      netAmount += parseFloat(product.net) || 0;
    }

    const billAmount = netAmount;
    const netPayable = netAmount - (parseFloat(extraDiscount) || 0);

    const purchase = new Purchase({
      invoiceNo,
      date: new Date(date),
      paymentType,
      supplier,
      creditDays,
      dueDate: dueDate ? new Date(dueDate) : null,
      products,
      totalPcs,
      netAmount,
      billAmount,
      netPayable,
      previousBalance,
      cashPaid,
      discPercentFooter,
      extraDiscount,
      transporter,
      builtyNo,
      description,
      sendSMS,
      printPreBalance
    });

    const createdPurchase = await purchase.save();

    // Update product stock
    for (const product of products) {
      await Product.findByIdAndUpdate(product.product, { $inc: { stock: product.pcs } });
    }

    res.status(201).json(createdPurchase);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Invoice number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update purchase
// @route   PUT /api/purchases/:id
// @access  Public
const updatePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    const {
      invoiceNo,
      date,
      paymentType,
      supplier,
      creditDays,
      dueDate,
      products,
      previousBalance,
      cashPaid,
      discPercentFooter,
      extraDiscount,
      transporter,
      builtyNo,
      description,
      sendSMS,
      printPreBalance,
      status
    } = req.body;

    // Calculate totals
    let totalPcs = 0;
    let netAmount = 0;

    for (const product of products) {
      totalPcs += parseFloat(product.pcs) || 0;
      netAmount += parseFloat(product.net) || 0;
    }

    const billAmount = netAmount;
    const netPayable = netAmount - (parseFloat(extraDiscount) || 0);

    purchase.invoiceNo = invoiceNo || purchase.invoiceNo;
    purchase.date = date ? new Date(date) : purchase.date;
    purchase.paymentType = paymentType || purchase.paymentType;
    purchase.supplier = supplier || purchase.supplier;
    purchase.creditDays = creditDays !== undefined ? creditDays : purchase.creditDays;
    purchase.dueDate = dueDate ? new Date(dueDate) : purchase.dueDate;
    purchase.products = products || purchase.products;
    purchase.totalPcs = totalPcs;
    purchase.netAmount = netAmount;
    purchase.billAmount = billAmount;
    purchase.netPayable = netPayable;
    purchase.previousBalance = previousBalance !== undefined ? previousBalance : purchase.previousBalance;
    purchase.cashPaid = cashPaid !== undefined ? cashPaid : purchase.cashPaid;
    purchase.discPercentFooter = discPercentFooter !== undefined ? discPercentFooter : purchase.discPercentFooter;
    purchase.extraDiscount = extraDiscount !== undefined ? extraDiscount : purchase.extraDiscount;
    purchase.transporter = transporter || purchase.transporter;
    purchase.builtyNo = builtyNo || purchase.builtyNo;
    purchase.description = description || purchase.description;
    purchase.sendSMS = sendSMS !== undefined ? sendSMS : purchase.sendSMS;
    purchase.printPreBalance = printPreBalance !== undefined ? printPreBalance : purchase.printPreBalance;
    purchase.status = status || purchase.status;

    const updatedPurchase = await purchase.save();
    res.json(updatedPurchase);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Invoice number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete purchase
// @route   DELETE /api/purchases/:id
// @access  Public
const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // Reverse stock updates
    for (const product of purchase.products) {
      await Product.findByIdAndUpdate(product.product, { $inc: { stock: -product.pcs } });
    }

    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ message: 'Purchase deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search purchases
// @route   GET /api/purchases/search/:query
// @access  Public
const searchPurchases = async (req, res) => {
  try {
    const query = req.params.query;
    const purchases = await Purchase.find({
      $or: [
        { invoiceNo: { $regex: query, $options: 'i' } }
      ]
    }).populate('supplier', 'code name').limit(10);
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  searchPurchases
};
