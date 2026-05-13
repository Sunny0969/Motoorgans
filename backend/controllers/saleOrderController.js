const SaleOrder = require('../models/SaleOrder');
const Customer = require('../models/Customer');

// @desc    Get all sale orders
// @route   GET /api/sale-orders
// @access  Public
const getSaleOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const saleOrders = await SaleOrder.find(filter)
      .populate('customer', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SaleOrder.countDocuments(filter);

    res.json({
      success: true,
      data: saleOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single sale order
// @route   GET /api/sale-orders/:id
// @access  Public
const getSaleOrder = async (req, res) => {
  try {
    const saleOrder = await SaleOrder.findById(req.params.id)
      .populate('customer', 'name code phone address location');

    if (!saleOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sale order not found'
      });
    }

    res.json({
      success: true,
      data: saleOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new sale order
// @route   POST /api/sale-orders
// @access  Public
const createSaleOrder = async (req, res) => {
  try {
    const {
      orderNumber,
      date,
      deliveryDate,
      customer,
      customerDetails,
      salesPerson,
      products,
      advancedPayment,
      notes
    } = req.body;

    // Validate required fields
    if (!orderNumber || !date || !deliveryDate || !customer || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if order number already exists
    const existingOrder = await SaleOrder.findOne({ orderNumber });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: 'Order number already exists'
      });
    }

    // Validate customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer'
      });
    }

    // Calculate totals
    const totals = products.reduce((acc, product) => {
      const qty = parseFloat(product.qty) || 0;
      const rate = parseFloat(product.rate) || 0;
      const discPercent = parseFloat(product.discPercent) || 0;

      const amt = qty * rate;
      const disc = amt * (discPercent / 100);
      const net = amt - disc;

      acc.quantity += qty;
      acc.amount += amt;
      acc.discount += disc;
      acc.net += net;

      return acc;
    }, { quantity: 0, amount: 0, discount: 0, net: 0 });

    const remainingAmount = totals.net - (parseFloat(advancedPayment) || 0);

    const saleOrder = new SaleOrder({
      orderNumber,
      date: new Date(date),
      deliveryDate: new Date(deliveryDate),
      customer,
      customerDetails,
      salesPerson,
      products,
      totals,
      advancedPayment: parseFloat(advancedPayment) || 0,
      remainingAmount,
      notes
    });

    const savedOrder = await saleOrder.save();

    await savedOrder.populate('customer', 'name code');

    res.status(201).json({
      success: true,
      data: savedOrder,
      message: 'Sale order created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update sale order
// @route   PUT /api/sale-orders/:id
// @access  Public
const updateSaleOrder = async (req, res) => {
  try {
    const {
      orderNumber,
      date,
      deliveryDate,
      customer,
      customerDetails,
      salesPerson,
      products,
      advancedPayment,
      status,
      notes
    } = req.body;

    const saleOrder = await SaleOrder.findById(req.params.id);

    if (!saleOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sale order not found'
      });
    }

    // Check if order number is being changed and if it already exists
    if (orderNumber !== saleOrder.orderNumber) {
      const existingOrder = await SaleOrder.findOne({ orderNumber });
      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: 'Order number already exists'
        });
      }
    }

    // Validate customer exists if changed
    if (customer !== saleOrder.customer.toString()) {
      const customerExists = await Customer.findById(customer);
      if (!customerExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid customer'
        });
      }
    }

    // Update fields
    saleOrder.orderNumber = orderNumber || saleOrder.orderNumber;
    saleOrder.date = date ? new Date(date) : saleOrder.date;
    saleOrder.deliveryDate = deliveryDate ? new Date(deliveryDate) : saleOrder.deliveryDate;
    saleOrder.customer = customer || saleOrder.customer;
    saleOrder.customerDetails = customerDetails || saleOrder.customerDetails;
    saleOrder.salesPerson = salesPerson || saleOrder.salesPerson;
    saleOrder.products = products || saleOrder.products;
    saleOrder.advancedPayment = parseFloat(advancedPayment) || saleOrder.advancedPayment;
    saleOrder.status = status || saleOrder.status;
    saleOrder.notes = notes || saleOrder.notes;

    const updatedOrder = await saleOrder.save();

    await updatedOrder.populate('customer', 'name code');

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Sale order updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete sale order
// @route   DELETE /api/sale-orders/:id
// @access  Public
const deleteSaleOrder = async (req, res) => {
  try {
    const saleOrder = await SaleOrder.findById(req.params.id);

    if (!saleOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sale order not found'
      });
    }

    await SaleOrder.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Sale order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get next order number
// @route   GET /api/sale-orders/next-order-number
// @access  Public
const getNextOrderNumber = async (req, res) => {
  try {
    const lastOrder = await SaleOrder.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextNumber = 1;

    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber);
      nextNumber = lastNumber + 1;
    }

    res.json({
      success: true,
      data: {
        orderNumber: nextNumber.toString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Search sale orders
// @route   GET /api/sale-orders/search/:query
// @access  Public
const searchSaleOrders = async (req, res) => {
  try {
    const query = req.params.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(query, 'i');

    const saleOrders = await SaleOrder.find({
      $or: [
        { orderNumber: searchRegex },
        { salesPerson: searchRegex },
        { notes: searchRegex }
      ]
    })
      .populate('customer', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SaleOrder.countDocuments({
      $or: [
        { orderNumber: searchRegex },
        { salesPerson: searchRegex },
        { notes: searchRegex }
      ]
    });

    res.json({
      success: true,
      data: saleOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getSaleOrders,
  getSaleOrder,
  createSaleOrder,
  updateSaleOrder,
  deleteSaleOrder,
  getNextOrderNumber,
  searchSaleOrders
};
