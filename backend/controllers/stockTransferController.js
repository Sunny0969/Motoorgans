const StockTransfer = require('../models/StockTransfer');
const Product = require('../models/Product');
const Location = require('../models/Location');
const User = require('../models/User');
const StockMovement = require('../models/StockMovement');

// @desc    Get all stock transfers
// @route   GET /api/stock-transfers
// @access  Public
const getStockTransfers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      fromLocation = 'all',
      toLocation = 'all',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filter = {};

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Location filters
    if (fromLocation && fromLocation !== 'all') {
      filter.fromLocation = fromLocation;
    }
    if (toLocation && toLocation !== 'all') {
      filter.toLocation = toLocation;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { transferNumber: new RegExp(search, 'i') },
        { vehicleNumber: new RegExp(search, 'i') },
        { driverName: new RegExp(search, 'i') }
      ];
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transfers = await StockTransfer.find(filter)
      .populate('fromLocation', 'name')
      .populate('toLocation', 'name')
      .populate('transferredBy', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StockTransfer.countDocuments(filter);

    res.json({
      transfers,
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

// @desc    Get single stock transfer
// @route   GET /api/stock-transfers/:id
// @access  Public
const getStockTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id)
      .populate('fromLocation', 'name')
      .populate('toLocation', 'name')
      .populate('transferredBy', 'name')
      .populate('createdBy', 'name');

    if (!transfer) {
      return res.status(404).json({ message: 'Stock transfer not found' });
    }

    res.json(transfer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new stock transfer
// @route   POST /api/stock-transfers
// @access  Public
const createStockTransfer = async (req, res) => {
  try {
    const {
      transferNumber,
      date,
      transferDate,
      fromLocation,
      toLocation,
      transferredBy,
      receivedBy,
      vehicleNumber,
      driverName,
      notes,
      items
    } = req.body;

    // Validate required fields
    if (!transferNumber || !date || !transferDate || !fromLocation || !toLocation || !transferredBy) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if locations are different
    if (fromLocation === toLocation) {
      return res.status(400).json({ message: 'From and To locations cannot be the same' });
    }

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Validate each item
    for (const item of items) {
      if (!item.product || !item.productName || !item.transferQty || item.transferQty <= 0) {
        return res.status(400).json({ message: 'Invalid item data' });
      }

      // Check if transfer quantity doesn't exceed available stock
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productName} not found` });
      }

      if (item.transferQty > product.stock) {
        return res.status(400).json({
          message: `Transfer quantity for ${item.productName} exceeds available stock (${product.stock})`
        });
      }
    }

    // Generate transfer number if not provided
    let finalTransferNumber = transferNumber;
    if (!finalTransferNumber) {
      const count = await StockTransfer.countDocuments();
      finalTransferNumber = `ST-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
    }

    // Check for duplicate transfer number
    const existingTransfer = await StockTransfer.findOne({ transferNumber: finalTransferNumber });
    if (existingTransfer) {
      return res.status(400).json({ message: 'Transfer number already exists' });
    }

    const transfer = new StockTransfer({
      transferNumber: finalTransferNumber,
      date: new Date(date),
      transferDate: new Date(transferDate),
      fromLocation,
      toLocation,
      transferredBy,
      receivedBy,
      vehicleNumber,
      driverName,
      notes,
      items,
      createdBy: req.user?.id // Assuming auth middleware sets req.user
    });

    const savedTransfer = await transfer.save();

    // Populate the saved transfer
    const populatedTransfer = await StockTransfer.findById(savedTransfer._id)
      .populate('fromLocation', 'name')
      .populate('toLocation', 'name')
      .populate('transferredBy', 'name');

    res.status(201).json(populatedTransfer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update stock transfer
// @route   PUT /api/stock-transfers/:id
// @access  Public
const updateStockTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ message: 'Stock transfer not found' });
    }

    // Prevent updates if already completed or in transit
    if (transfer.status === 'Completed' || transfer.status === 'In Transit') {
      return res.status(400).json({ message: 'Cannot update transfer that is already in progress or completed' });
    }

    const {
      transferNumber,
      date,
      transferDate,
      fromLocation,
      toLocation,
      transferredBy,
      receivedBy,
      vehicleNumber,
      driverName,
      notes,
      items
    } = req.body;

    // Validate locations
    if (fromLocation === toLocation) {
      return res.status(400).json({ message: 'From and To locations cannot be the same' });
    }

    // Validate items if provided
    if (items && items.length > 0) {
      for (const item of items) {
        if (!item.product || !item.productName || !item.transferQty || item.transferQty <= 0) {
          return res.status(400).json({ message: 'Invalid item data' });
        }

        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ message: `Product ${item.productName} not found` });
        }

        if (item.transferQty > product.stock) {
          return res.status(400).json({
            message: `Transfer quantity for ${item.productName} exceeds available stock (${product.stock})`
          });
        }
      }
    }

    // Update fields
    if (transferNumber) transfer.transferNumber = transferNumber;
    if (date) transfer.date = new Date(date);
    if (transferDate) transfer.transferDate = new Date(transferDate);
    if (fromLocation) transfer.fromLocation = fromLocation;
    if (toLocation) transfer.toLocation = toLocation;
    if (transferredBy) transfer.transferredBy = transferredBy;
    if (receivedBy !== undefined) transfer.receivedBy = receivedBy;
    if (vehicleNumber !== undefined) transfer.vehicleNumber = vehicleNumber;
    if (driverName !== undefined) transfer.driverName = driverName;
    if (notes !== undefined) transfer.notes = notes;
    if (items) transfer.items = items;

    const updatedTransfer = await transfer.save();

    const populatedTransfer = await StockTransfer.findById(updatedTransfer._id)
      .populate('fromLocation', 'name')
      .populate('toLocation', 'name')
      .populate('transferredBy', 'name');

    res.json(populatedTransfer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete stock transfer
// @route   DELETE /api/stock-transfers/:id
// @access  Public
const deleteStockTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ message: 'Stock transfer not found' });
    }

    // Prevent deletion if already completed or in transit
    if (transfer.status === 'Completed' || transfer.status === 'In Transit') {
      return res.status(400).json({ message: 'Cannot delete transfer that is already in progress or completed' });
    }

    await StockTransfer.findByIdAndDelete(req.params.id);

    res.json({ message: 'Stock transfer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Dispatch stock transfer
// @route   PUT /api/stock-transfers/:id/dispatch
// @access  Public
const dispatchStockTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ message: 'Stock transfer not found' });
    }

    if (transfer.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending transfers can be dispatched' });
    }

    if (transfer.items.length === 0) {
      return res.status(400).json({ message: 'Cannot dispatch transfer with no items' });
    }

    // Update product stock levels and create stock movements
    for (const item of transfer.items) {
      const product = await Product.findById(item.product);
      if (product) {
        // Reduce stock at source location
        product.stock -= item.transferQty;
        await product.save();

        // Record stock movement
        const movement = new StockMovement({
          product: product._id,
          productName: product.name,
          productSku: product.code,
          movementType: 'transfer',
          quantity: -item.transferQty, // Negative for outgoing
          previousStock: product.stock + item.transferQty,
          newStock: product.stock,
          reference: transfer.transferNumber,
          referenceId: transfer._id,
          referenceModel: 'StockTransfer',
          notes: `Transferred to ${transfer.toLocation}`,
          location: transfer.fromLocation
        });
        await movement.save();
      }
    }

    // Update transfer status
    transfer.status = 'In Transit';
    transfer.dispatchedAt = new Date();
    await transfer.save();

    const populatedTransfer = await StockTransfer.findById(transfer._id)
      .populate('fromLocation', 'name')
      .populate('toLocation', 'name')
      .populate('transferredBy', 'name');

    res.json({
      message: 'Stock transfer dispatched successfully',
      transfer: populatedTransfer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Receive stock transfer
// @route   PUT /api/stock-transfers/:id/receive
// @access  Public
const receiveStockTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ message: 'Stock transfer not found' });
    }

    if (transfer.status !== 'In Transit') {
      return res.status(400).json({ message: 'Only in-transit transfers can be received' });
    }

    // Update product stock levels at destination and create stock movements
    for (const item of transfer.items) {
      const product = await Product.findById(item.product);
      if (product) {
        // Increase stock at destination location
        product.stock += item.transferQty;
        await product.save();

        // Record stock movement
        const movement = new StockMovement({
          product: product._id,
          productName: product.name,
          productSku: product.code,
          movementType: 'transfer',
          quantity: item.transferQty, // Positive for incoming
          previousStock: product.stock - item.transferQty,
          newStock: product.stock,
          reference: transfer.transferNumber,
          referenceId: transfer._id,
          referenceModel: 'StockTransfer',
          notes: `Received from ${transfer.fromLocation}`,
          location: transfer.toLocation
        });
        await movement.save();
      }
    }

    // Update transfer status
    transfer.status = 'Completed';
    transfer.receivedAt = new Date();
    await transfer.save();

    const populatedTransfer = await StockTransfer.findById(transfer._id)
      .populate('fromLocation', 'name')
      .populate('toLocation', 'name')
      .populate('transferredBy', 'name');

    res.json({
      message: 'Stock transfer received successfully',
      transfer: populatedTransfer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stock transfer statistics
// @route   GET /api/stock-transfers/stats
// @access  Public
const getStockTransferStats = async (req, res) => {
  try {
    const stats = await StockTransfer.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalItems: { $sum: '$totalItems' },
          totalQuantity: { $sum: '$totalQuantity' }
        }
      }
    ]);

    const totalTransfers = await StockTransfer.countDocuments();
    const pendingTransfers = await StockTransfer.countDocuments({ status: 'Pending' });
    const inTransitTransfers = await StockTransfer.countDocuments({ status: 'In Transit' });
    const completedTransfers = await StockTransfer.countDocuments({ status: 'Completed' });

    res.json({
      summary: {
        totalTransfers,
        pendingTransfers,
        inTransitTransfers,
        completedTransfers
      },
      detailed: stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get products for transfer (with stock info)
// @route   GET /api/stock-transfers/products
// @access  Public
const getProductsForTransfer = async (req, res) => {
  try {
    const { location, search = '' } = req.query;

    let filter = { isActive: true, stock: { $gt: 0 } };

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { code: new RegExp(search, 'i') }
      ];
    }

    const products = await Product.find(filter)
      .populate('category')
      .select('name code category stock minStock maxStock cost price')
      .sort({ name: 1 });

    const productsWithDetails = products.map(product => ({
      _id: product._id,
      productCode: product.code,
      productName: product.name,
      category: product.category?.name || 'Uncategorized',
      availableStock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      cost: product.cost,
      price: product.price
    }));

    res.json(productsWithDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStockTransfers,
  getStockTransfer,
  createStockTransfer,
  updateStockTransfer,
  deleteStockTransfer,
  dispatchStockTransfer,
  receiveStockTransfer,
  getStockTransferStats,
  getProductsForTransfer
};
