const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Supplier = require('../models/Supplier');

// @desc    Get stock management overview
// @route   GET /api/stock-management/overview
// @access  Public
const getStockOverview = async (req, res) => {
  try {
    // Get total products count
    const totalProducts = await Product.countDocuments({ isActive: true });

    // Get low stock items (current stock <= min stock)
    const lowStockItems = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$minStock'] }
    }).countDocuments();

    // Get out of stock items
    const outOfStock = await Product.find({
      isActive: true,
      stock: 0
    }).countDocuments();

    // Calculate total stock value
    const products = await Product.find({ isActive: true });
    const totalValue = products.reduce((sum, product) => sum + (product.stock * product.cost), 0);

    // Get categories count
    const categories = await Product.distinct('category', { isActive: true });
    const categoriesCount = categories.length;

    // Get suppliers count
    const suppliersCount = await Supplier.countDocuments();

    // Get recent low stock items
    const recentLowStock = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$minStock'] }
    })
    .select('name stock minStock cost')
    .sort({ updatedAt: -1 })
    .limit(4);

    // Get stock by category
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          value: { $sum: { $multiply: ['$stock', '$cost'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get recent stock movements
    const recentMovements = await StockMovement.find()
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      summary: {
        totalProducts,
        lowStockItems,
        outOfStock,
        totalValue,
        categories: categoriesCount,
        suppliers: suppliersCount
      },
      lowStockItems: recentLowStock,
      categories: categoryStats,
      recentMovements
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all products with stock information
// @route   GET /api/stock-management/products
// @access  Public
const getStockProducts = async (req, res) => {
  try {
    const {
      search = '',
      category = 'all',
      status = 'all',
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    let filter = { isActive: true };

    // Search filter
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { code: new RegExp(search, 'i') }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Status filter
    if (status && status !== 'all') {
      switch (status) {
        case 'in-stock':
          filter.$expr = { $gt: ['$stock', '$minStock'] };
          break;
        case 'low-stock':
          filter.$expr = { $and: [
            { $lte: ['$stock', '$minStock'] },
            { $gt: ['$stock', 0] }
          ]};
          break;
        case 'out-of-stock':
          filter.stock = 0;
          break;
      }
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    // Add calculated fields
    const productsWithCalculations = products.map(product => ({
      ...product.toObject(),
      stockValue: product.stock * product.cost,
      profitMargin: product.price > 0 ? ((product.price - product.cost) / product.cost * 100) : 0,
      stockStatus: product.stock === 0 ? 'out-of-stock' :
                   product.stock <= product.minStock ? 'low-stock' : 'in-stock'
    }));

    res.json({
      products: productsWithCalculations,
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

// @desc    Get low stock items
// @route   GET /api/stock-management/low-stock
// @access  Public
const getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$minStock'] }
    })
    .populate('supplier', 'name')
    .sort({ stock: 1 });

    // Calculate days to stock out (simplified calculation)
    const itemsWithDays = lowStockItems.map(item => ({
      ...item.toObject(),
      deficit: item.minStock - item.stock,
      daysToStockOut: Math.max(1, Math.floor(item.stock / 5)) // Simplified calculation
    }));

    res.json(itemsWithDays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stock movement history
// @route   GET /api/stock-management/movements
// @access  Public
const getStockMovements = async (req, res) => {
  try {
    const {
      product = '',
      movementType = 'all',
      dateFrom = '',
      dateTo = '',
      page = 1,
      limit = 20
    } = req.query;

    let filter = {};

    // Product filter
    if (product) {
      filter.productName = new RegExp(product, 'i');
    }

    // Movement type filter
    if (movementType && movementType !== 'all') {
      filter.movementType = movementType;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const movements = await StockMovement.find(filter)
      .populate('product', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StockMovement.countDocuments(filter);

    res.json({
      movements,
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

// @desc    Update product stock
// @route   PUT /api/stock-management/products/:id/stock
// @access  Public
const updateProductStock = async (req, res) => {
  try {
    const { stock, reason, reference } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const previousStock = product.stock;
    const quantityChange = stock - previousStock;

    // Update product stock
    product.stock = stock;
    product.updatedAt = new Date();
    await product.save();

    // Record stock movement
    const movement = new StockMovement({
      product: product._id,
      productName: product.name,
      productSku: product.code,
      movementType: quantityChange > 0 ? 'purchase' : 'sale',
      quantity: quantityChange,
      previousStock,
      newStock: stock,
      costPrice: product.cost,
      sellingPrice: product.price,
      reference,
      notes: reason,
      location: product.location
    });

    await movement.save();

    res.json({
      message: 'Stock updated successfully',
      product,
      movement
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stock categories summary
// @route   GET /api/stock-management/categories
// @access  Public
const getStockCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$stock', '$cost'] } },
          avgPrice: { $avg: '$price' }
        }
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          totalStock: 1,
          totalValue: 1,
          avgPrice: 1
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stock alerts and notifications
// @route   GET /api/stock-management/alerts
// @access  Public
const getStockAlerts = async (req, res) => {
  try {
    const lowStock = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$minStock'] }
    }).countDocuments();

    const outOfStock = await Product.find({
      isActive: true,
      stock: 0
    }).countDocuments();

    const expiringSoon = await Product.find({
      isActive: true,
      expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // 30 days
    }).countDocuments();

    res.json({
      lowStock,
      outOfStock,
      expiringSoon,
      totalAlerts: lowStock + outOfStock + expiringSoon
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk update stock levels
// @route   PUT /api/stock-management/bulk-update
// @access  Public
const bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { productId, newStock, reason }

    const results = [];

    for (const update of updates) {
      const product = await Product.findById(update.productId);
      if (product) {
        const previousStock = product.stock;
        product.stock = update.newStock;
        await product.save();

        // Record movement
        const movement = new StockMovement({
          product: product._id,
          productName: product.name,
          productSku: product.code,
          movementType: 'adjustment',
          quantity: update.newStock - previousStock,
          previousStock,
          newStock: update.newStock,
          notes: update.reason
        });
        await movement.save();

        results.push({ productId: update.productId, success: true });
      } else {
        results.push({ productId: update.productId, success: false, error: 'Product not found' });
      }
    }

    res.json({ message: 'Bulk update completed', results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStockOverview,
  getStockProducts,
  getLowStockItems,
  getStockMovements,
  updateProductStock,
  getStockCategories,
  getStockAlerts,
  bulkUpdateStock
};
