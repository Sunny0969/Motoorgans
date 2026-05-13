const Sale = require('../models/Sale');
const Product = require('../models/Product');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Public
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().populate('customer', 'code name').sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Public
const getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('customer', 'code name');
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create sale
// @route   POST /api/sales
// @access  Public
const createSale = async (req, res) => {
  try {
    const {
      invoiceNo,
      date,
      paymentType,
      customer,
      customerName,
      customerCode,
      creditDays,
      dueDate,
      products,
      previousBalance,
      cashPaid,
      discPercentFooter,
      extraDiscount,
      transporter,
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

    const sale = new Sale({
      invoiceNo,
      date: new Date(date),
      paymentType,
      customer,
      customerName,
      customerCode,
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
      description,
      sendSMS,
      printPreBalance
    });

    const createdSale = await sale.save();

    // Update product stock
    for (const product of products) {
      await Product.findByIdAndUpdate(product.product, { $inc: { stock: -product.pcs } });
    }

    res.status(201).json(createdSale);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Invoice number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Public
const updateSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const {
      invoiceNo,
      date,
      paymentType,
      customer,
      customerName,
      customerCode,
      creditDays,
      dueDate,
      products,
      previousBalance,
      cashPaid,
      discPercentFooter,
      extraDiscount,
      transporter,
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

    sale.invoiceNo = invoiceNo || sale.invoiceNo;
    sale.date = date ? new Date(date) : sale.date;
    sale.paymentType = paymentType || sale.paymentType;
    sale.customer = customer || sale.customer;
    sale.customerName = customerName || sale.customerName;
    sale.customerCode = customerCode || sale.customerCode;
    sale.creditDays = creditDays !== undefined ? creditDays : sale.creditDays;
    sale.dueDate = dueDate ? new Date(dueDate) : sale.dueDate;
    sale.products = products || sale.products;
    sale.totalPcs = totalPcs;
    sale.netAmount = netAmount;
    sale.billAmount = billAmount;
    sale.netPayable = netPayable;
    sale.previousBalance = previousBalance !== undefined ? previousBalance : sale.previousBalance;
    sale.cashPaid = cashPaid !== undefined ? cashPaid : sale.cashPaid;
    sale.discPercentFooter = discPercentFooter !== undefined ? discPercentFooter : sale.discPercentFooter;
    sale.extraDiscount = extraDiscount !== undefined ? extraDiscount : sale.extraDiscount;
    sale.transporter = transporter || sale.transporter;
    sale.description = description || sale.description;
    sale.sendSMS = sendSMS !== undefined ? sendSMS : sale.sendSMS;
    sale.printPreBalance = printPreBalance !== undefined ? printPreBalance : sale.printPreBalance;
    sale.status = status || sale.status;

    const updatedSale = await sale.save();
    res.json(updatedSale);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Invoice number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Public
const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Reverse stock updates
    for (const product of sale.products) {
      await Product.findByIdAndUpdate(product.product, { $inc: { stock: product.pcs } });
    }

    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search sales
// @route   GET /api/sales/search/:query
// @access  Public
const searchSales = async (req, res) => {
  try {
    const query = req.params.query;
    const sales = await Sale.find({
      $or: [
        { invoiceNo: { $regex: query, $options: 'i' } }
      ]
    }).populate('customer', 'code name').limit(10);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
  searchSales
};
