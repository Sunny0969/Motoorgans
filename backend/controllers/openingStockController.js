const OpeningStock = require('../models/OpeningStock');
const Product = require('../models/Product');

// Get all opening stock entries
const getAllOpeningStocks = async (req, res) => {
  try {
    const openingStocks = await OpeningStock.find({ isActive: true })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: openingStocks
    });
  } catch (error) {
    console.error('Error fetching opening stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching opening stock entries',
      error: error.message
    });
  }
};

// Get opening stock by ID
const getOpeningStockById = async (req, res) => {
  try {
    const { id } = req.params;
    const openingStock = await OpeningStock.findById(id)
      .populate('createdBy', 'name');

    if (!openingStock) {
      return res.status(404).json({
        success: false,
        message: 'Opening stock entry not found'
      });
    }

    res.json({
      success: true,
      data: openingStock
    });
  } catch (error) {
    console.error('Error fetching opening stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching opening stock entry',
      error: error.message
    });
  }
};

// Create new opening stock entry
const createOpeningStock = async (req, res) => {
  try {
    const { referenceNumber, date, location, fiscalYear, notes, products } = req.body;

    // Validate required fields
    if (!referenceNumber || !date || !fiscalYear || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reference number, date, fiscal year, and products are required'
      });
    }

    // Check if reference number already exists
    const existingStock = await OpeningStock.findOne({ referenceNumber });
    if (existingStock) {
      return res.status(400).json({
        success: false,
        message: 'Reference number already exists'
      });
    }

    // Create opening stock entry
    const openingStock = new OpeningStock({
      referenceNumber,
      date: new Date(date),
      location,
      fiscalYear,
      notes,
      products,
      createdBy: req.user.id
    });

    await openingStock.save();

    // Update product stock levels
    for (const productItem of products) {
      const product = await Product.findOne({ code: productItem.productCode });
      if (product) {
        product.stock = (product.stock || 0) + productItem.quantity;
        product.cost = productItem.unitCost;
        await product.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Opening stock entry created successfully',
      data: openingStock
    });
  } catch (error) {
    console.error('Error creating opening stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating opening stock entry',
      error: error.message
    });
  }
};

// Update opening stock entry
const updateOpeningStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { referenceNumber, date, location, fiscalYear, notes, products } = req.body;

    const openingStock = await OpeningStock.findById(id);
    if (!openingStock) {
      return res.status(404).json({
        success: false,
        message: 'Opening stock entry not found'
      });
    }

    // Check if reference number is being changed and if it already exists
    if (referenceNumber !== openingStock.referenceNumber) {
      const existingStock = await OpeningStock.findOne({ referenceNumber });
      if (existingStock) {
        return res.status(400).json({
          success: false,
          message: 'Reference number already exists'
        });
      }
    }

    // Reverse previous stock updates
    for (const productItem of openingStock.products) {
      const product = await Product.findOne({ code: productItem.productCode });
      if (product) {
        product.stock = Math.max(0, (product.stock || 0) - productItem.quantity);
        await product.save();
      }
    }

    // Update opening stock entry
    openingStock.referenceNumber = referenceNumber;
    openingStock.date = new Date(date);
    openingStock.location = location;
    openingStock.fiscalYear = fiscalYear;
    openingStock.notes = notes;
    openingStock.products = products;

    await openingStock.save();

    // Apply new stock updates
    for (const productItem of products) {
      const product = await Product.findOne({ code: productItem.productCode });
      if (product) {
        product.stock = (product.stock || 0) + productItem.quantity;
        product.cost = productItem.unitCost;
        await product.save();
      }
    }

    res.json({
      success: true,
      message: 'Opening stock entry updated successfully',
      data: openingStock
    });
  } catch (error) {
    console.error('Error updating opening stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating opening stock entry',
      error: error.message
    });
  }
};

// Delete opening stock entry
const deleteOpeningStock = async (req, res) => {
  try {
    const { id } = req.params;

    const openingStock = await OpeningStock.findById(id);
    if (!openingStock) {
      return res.status(404).json({
        success: false,
        message: 'Opening stock entry not found'
      });
    }

    // Reverse stock updates
    for (const productItem of openingStock.products) {
      const product = await Product.findOne({ code: productItem.productCode });
      if (product) {
        product.stock = Math.max(0, (product.stock || 0) - productItem.quantity);
        await product.save();
      }
    }

    // Soft delete
    openingStock.isActive = false;
    await openingStock.save();

    res.json({
      success: true,
      message: 'Opening stock entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting opening stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting opening stock entry',
      error: error.message
    });
  }
};

// Get products for dropdown
const getProductsForDropdown = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .select('code name category uom')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// Import opening stock from Excel
const importOpeningStock = async (req, res) => {
  try {
    // This would handle Excel file upload and processing
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Import functionality - Excel file processing would be implemented here'
    });
  } catch (error) {
    console.error('Error importing opening stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing opening stock',
      error: error.message
    });
  }
};

// Export opening stock to Excel
const exportOpeningStock = async (req, res) => {
  try {
    const { id } = req.params;

    const openingStock = await OpeningStock.findById(id);
    if (!openingStock) {
      return res.status(404).json({
        success: false,
        message: 'Opening stock entry not found'
      });
    }

    // This would generate and return Excel file
    // For now, return the data
    res.json({
      success: true,
      message: 'Export functionality - Excel file generation would be implemented here',
      data: openingStock
    });
  } catch (error) {
    console.error('Error exporting opening stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting opening stock',
      error: error.message
    });
  }
};

module.exports = {
  getAllOpeningStocks,
  getOpeningStockById,
  createOpeningStock,
  updateOpeningStock,
  deleteOpeningStock,
  getProductsForDropdown,
  importOpeningStock,
  exportOpeningStock
};
