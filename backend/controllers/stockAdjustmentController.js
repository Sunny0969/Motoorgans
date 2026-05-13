const StockAdjustment = require('../models/StockAdjustment');
const StockAdjustmentItem = require('../models/StockAdjustmentItem');
const Product = require('../models/Product');

// @desc    Get all stock adjustments with filtering and pagination
// @route   GET /api/stock-adjustments
// @access  Public
const getStockAdjustments = async (req, res) => {
  try {
    const {
      status,
      location,
      adjustmentType,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filter = {};

    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Filter by location
    if (location && location !== 'all') {
      filter.location = location;
    }

    // Filter by adjustment type
    if (adjustmentType && adjustmentType !== 'all') {
      filter.adjustmentType = adjustmentType;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const adjustments = await StockAdjustment.find(filter)
      .populate('items')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StockAdjustment.countDocuments(filter);

    res.json({
      adjustments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single stock adjustment
// @route   GET /api/stock-adjustments/:id
// @access  Public
const getStockAdjustment = async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id)
      .populate('items');

    if (!adjustment) {
      return res.status(404).json({ message: 'Stock adjustment not found' });
    }

    res.json(adjustment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new stock adjustment
// @route   POST /api/stock-adjustments
// @access  Public
const createStockAdjustment = async (req, res) => {
  try {
    const {
      adjustmentNumber,
      date,
      adjustmentDate,
      location,
      adjustmentType,
      reason,
      reference,
      adjustedBy,
      approvedBy,
      notes,
      products
    } = req.body;

    // Validate required fields
    if (!adjustmentNumber || !location || !adjustmentType || !reason || !products || products.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if adjustment number already exists
    const existing = await StockAdjustment.findOne({ adjustmentNumber });
    if (existing) {
      return res.status(400).json({ message: 'Adjustment number already exists' });
    }

    // Calculate totals
    const totalItems = products.length;
    const totalAdjustmentQty = products.reduce((sum, p) => sum + (parseFloat(p.adjustmentQty) || 0), 0);
    const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.totalValue) || 0), 0);

    // Create adjustment items
    const adjustmentItems = [];
    for (const product of products) {
      const item = new StockAdjustmentItem({
        productCode: product.productCode,
        productName: product.productName,
        category: product.category,
        currentStock: parseFloat(product.currentStock),
        newStock: parseFloat(product.newStock),
        adjustmentQty: parseFloat(product.adjustmentQty),
        uom: product.uom,
        costPrice: parseFloat(product.costPrice),
        totalValue: parseFloat(product.totalValue),
        remarks: product.remarks
      });
      const savedItem = await item.save();
      adjustmentItems.push(savedItem._id);
    }

    // Create stock adjustment
    const adjustment = new StockAdjustment({
      adjustmentNumber,
      date,
      adjustmentDate,
      location,
      adjustmentType,
      reason,
      reference,
      adjustedBy,
      approvedBy,
      notes,
      totalItems,
      totalAdjustmentQty,
      totalValue,
      items: adjustmentItems
    });

    const savedAdjustment = await adjustment.save();

    res.status(201).json(savedAdjustment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update stock adjustment
// @route   PUT /api/stock-adjustments/:id
// @access  Public
const updateStockAdjustment = async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id);

    if (!adjustment) {
      return res.status(404).json({ message: 'Stock adjustment not found' });
    }

    // Only allow updates if status is Pending
    if (adjustment.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot update adjustment that is not in Pending status' });
    }

    const {
      date,
      adjustmentDate,
      location,
      adjustmentType,
      reason,
      reference,
      adjustedBy,
      approvedBy,
      notes,
      products
    } = req.body;

    // Update items if products provided
    if (products && products.length > 0) {
      // Delete existing items
      await StockAdjustmentItem.deleteMany({ stockAdjustment: req.params.id });

      // Create new items
      const adjustmentItems = [];
      for (const product of products) {
        const item = new StockAdjustmentItem({
          stockAdjustment: req.params.id,
          productCode: product.productCode,
          productName: product.productName,
          category: product.category,
          currentStock: parseFloat(product.currentStock),
          newStock: parseFloat(product.newStock),
          adjustmentQty: parseFloat(product.adjustmentQty),
          uom: product.uom,
          costPrice: parseFloat(product.costPrice),
          totalValue: parseFloat(product.totalValue),
          remarks: product.remarks
        });
        const savedItem = await item.save();
        adjustmentItems.push(savedItem._id);
      }

      // Calculate totals
      const totalItems = products.length;
      const totalAdjustmentQty = products.reduce((sum, p) => sum + (parseFloat(p.adjustmentQty) || 0), 0);
      const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.totalValue) || 0), 0);

      adjustment.items = adjustmentItems;
      adjustment.totalItems = totalItems;
      adjustment.totalAdjustmentQty = totalAdjustmentQty;
      adjustment.totalValue = totalValue;
    }

    // Update other fields
    if (date) adjustment.date = date;
    if (adjustmentDate) adjustment.adjustmentDate = adjustmentDate;
    if (location) adjustment.location = location;
    if (adjustmentType) adjustment.adjustmentType = adjustmentType;
    if (reason) adjustment.reason = reason;
    if (reference !== undefined) adjustment.reference = reference;
    if (adjustedBy) adjustment.adjustedBy = adjustedBy;
    if (approvedBy !== undefined) adjustment.approvedBy = approvedBy;
    if (notes !== undefined) adjustment.notes = notes;

    const updatedAdjustment = await adjustment.save();
    await updatedAdjustment.populate('items');

    res.json(updatedAdjustment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete stock adjustment
// @route   DELETE /api/stock-adjustments/:id
// @access  Public
const deleteStockAdjustment = async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id);

    if (!adjustment) {
      return res.status(404).json({ message: 'Stock adjustment not found' });
    }

    // Only allow deletion if status is Pending
    if (adjustment.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot delete adjustment that is not in Pending status' });
    }

    // Delete associated items
    await StockAdjustmentItem.deleteMany({ stockAdjustment: req.params.id });

    // Delete adjustment
    await StockAdjustment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Stock adjustment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit stock adjustment for approval
// @route   PUT /api/stock-adjustments/:id/submit
// @access  Public
const submitStockAdjustment = async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id);

    if (!adjustment) {
      return res.status(404).json({ message: 'Stock adjustment not found' });
    }

    if (adjustment.status !== 'Pending') {
      return res.status(400).json({ message: 'Adjustment must be in Pending status to submit' });
    }

    adjustment.status = 'Submitted';
    await adjustment.save();

    res.json({ message: 'Stock adjustment submitted for approval', adjustment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve stock adjustment
// @route   PUT /api/stock-adjustments/:id/approve
// @access  Public
const approveStockAdjustment = async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id);

    if (!adjustment) {
      return res.status(404).json({ message: 'Stock adjustment not found' });
    }

    if (adjustment.status !== 'Submitted') {
      return res.status(400).json({ message: 'Adjustment must be submitted before approval' });
    }

    adjustment.status = 'Approved';
    await adjustment.save();

    res.json({ message: 'Stock adjustment approved', adjustment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete stock adjustment (update product stock)
// @route   PUT /api/stock-adjustments/:id/complete
// @access  Public
const completeStockAdjustment = async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id).populate('items');

    if (!adjustment) {
      return res.status(404).json({ message: 'Stock adjustment not found' });
    }

    if (adjustment.status !== 'Approved') {
      return res.status(400).json({ message: 'Adjustment must be approved before completion' });
    }

    // Update product stock levels
    for (const item of adjustment.items) {
      const product = await Product.findOne({ code: item.productCode });
      if (product) {
        product.stock = item.newStock;
        await product.save();
      }
    }

    adjustment.status = 'Completed';
    await adjustment.save();

    res.json({ message: 'Stock adjustment completed and inventory updated', adjustment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get products for stock adjustment
// @route   GET /api/stock-adjustments/products
// @access  Public
const getProductsForAdjustment = async (req, res) => {
  try {
    const { location } = req.query;

    let filter = { isActive: true };
    if (location && location !== 'all') {
      filter.location = location;
    }

    const products = await Product.find(filter)
      .select('code name category uom stock cost location')
      .sort({ name: 1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate next adjustment number
// @route   GET /api/stock-adjustments/next-number
// @access  Public
const getNextAdjustmentNumber = async (req, res) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const prefix = `SA-${year}${month}${day}-`;

    // Find the last adjustment number for today
    const lastAdjustment = await StockAdjustment.findOne({
      adjustmentNumber: new RegExp(`^${prefix}`)
    }).sort({ adjustmentNumber: -1 });

    let nextNumber = 1;
    if (lastAdjustment) {
      const lastNum = parseInt(lastAdjustment.adjustmentNumber.split('-').pop());
      nextNumber = lastNum + 1;
    }

    const adjustmentNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;

    res.json({ adjustmentNumber });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStockAdjustments,
  getStockAdjustment,
  createStockAdjustment,
  updateStockAdjustment,
  deleteStockAdjustment,
  submitStockAdjustment,
  approveStockAdjustment,
  completeStockAdjustment,
  getProductsForAdjustment,
  getNextAdjustmentNumber
};
