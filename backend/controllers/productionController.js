const Production = require('../models/Production');

// @desc    Get all productions
// @route   GET /api/productions
// @access  Public
const getAllProductions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', productionOrder = '' } = req.query;

    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { productionNumber: { $regex: search, $options: 'i' } },
        { productionOrder: { $regex: search, $options: 'i' } },
        { productionLine: { $regex: search, $options: 'i' } },
        { supervisor: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // Production order filter
    if (productionOrder && productionOrder !== 'All') {
      query.productionOrder = productionOrder;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const productions = await Production.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Production.countDocuments(query);

    res.json({
      productions,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single production
// @route   GET /api/productions/:id
// @access  Public
const getProductionById = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({ message: 'Production not found' });
    }
    res.json(production);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create production
// @route   POST /api/productions
// @access  Public
const createProduction = async (req, res) => {
  try {
    const productionData = req.body;

    // Validate required fields
    const requiredFields = ['date', 'productionDate', 'productionOrder', 'productionLine', 'expectedCompletion'];
    for (const field of requiredFields) {
      if (!productionData[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Validate materials and products
    if (!productionData.materials || productionData.materials.length === 0) {
      return res.status(400).json({ message: 'At least one material is required' });
    }

    if (!productionData.products || productionData.products.length === 0) {
      return res.status(400).json({ message: 'At least one product is required' });
    }

    // Validate material quantities
    for (const material of productionData.materials) {
      if (material.requiredQty <= 0) {
        return res.status(400).json({ message: 'Material required quantity must be greater than 0' });
      }
      if (material.requiredQty > material.availableStock) {
        return res.status(400).json({ message: 'Required quantity cannot exceed available stock' });
      }
    }

    // Validate product quantities
    for (const product of productionData.products) {
      if (product.plannedQty <= 0) {
        return res.status(400).json({ message: 'Product planned quantity must be greater than 0' });
      }
      if (product.producedQty > product.plannedQty) {
        return res.status(400).json({ message: 'Produced quantity cannot exceed planned quantity' });
      }
    }

    // Calculate summary
    const summary = {
      totalMaterials: productionData.materials.length,
      totalProducts: productionData.products.length,
      totalMaterialCost: productionData.materials.reduce((sum, m) => sum + (parseFloat(m.totalCost) || 0), 0),
      totalProductionQty: productionData.products.reduce((sum, p) => sum + (parseFloat(p.producedQty) || 0), 0)
    };

    productionData.summary = summary;

    const production = new Production(productionData);
    const savedProduction = await production.save();

    res.status(201).json(savedProduction);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Production number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update production
// @route   PUT /api/productions/:id
// @access  Public
const updateProduction = async (req, res) => {
  try {
    const productionData = req.body;

    // Validate materials and products if provided
    if (productionData.materials) {
      for (const material of productionData.materials) {
        if (material.requiredQty <= 0) {
          return res.status(400).json({ message: 'Material required quantity must be greater than 0' });
        }
        if (material.requiredQty > material.availableStock) {
          return res.status(400).json({ message: 'Required quantity cannot exceed available stock' });
        }
      }
    }

    if (productionData.products) {
      for (const product of productionData.products) {
        if (product.plannedQty <= 0) {
          return res.status(400).json({ message: 'Product planned quantity must be greater than 0' });
        }
        if (product.producedQty > product.plannedQty) {
          return res.status(400).json({ message: 'Produced quantity cannot exceed planned quantity' });
        }
      }
    }

    // Recalculate summary if materials or products changed
    if (productionData.materials || productionData.products) {
      const existingProduction = await Production.findById(req.params.id);
      const materials = productionData.materials || existingProduction.materials;
      const products = productionData.products || existingProduction.products;

      productionData.summary = {
        totalMaterials: materials.length,
        totalProducts: products.length,
        totalMaterialCost: materials.reduce((sum, m) => sum + (parseFloat(m.totalCost) || 0), 0),
        totalProductionQty: products.reduce((sum, p) => sum + (parseFloat(p.producedQty) || 0), 0)
      };
    }

    const production = await Production.findByIdAndUpdate(
      req.params.id,
      productionData,
      { new: true, runValidators: true }
    );

    if (!production) {
      return res.status(404).json({ message: 'Production not found' });
    }

    res.json(production);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Production number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete production
// @route   DELETE /api/productions/:id
// @access  Public
const deleteProduction = async (req, res) => {
  try {
    const production = await Production.findByIdAndDelete(req.params.id);

    if (!production) {
      return res.status(404).json({ message: 'Production not found' });
    }

    res.json({ message: 'Production deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update production status
// @route   PUT /api/productions/:id/status
// @access  Public
const updateProductionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Planned', 'In Progress', 'Paused', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const production = await Production.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!production) {
      return res.status(404).json({ message: 'Production not found' });
    }

    res.json(production);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get production statistics
// @route   GET /api/productions/stats/summary
// @access  Public
const getProductionStats = async (req, res) => {
  try {
    const totalProductions = await Production.countDocuments();
    const completedProductions = await Production.countDocuments({ status: 'Completed' });
    const inProgressProductions = await Production.countDocuments({ status: 'In Progress' });

    const totalMaterialCost = await Production.aggregate([
      { $group: { _id: null, total: { $sum: '$summary.totalMaterialCost' } } }
    ]);

    const totalProductionQty = await Production.aggregate([
      { $group: { _id: null, total: { $sum: '$summary.totalProductionQty' } } }
    ]);

    const statusCounts = await Production.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      totalProductions,
      completedProductions,
      inProgressProductions,
      totalMaterialCost: totalMaterialCost[0]?.total || 0,
      totalProductionQty: totalProductionQty[0]?.total || 0,
      statusCounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllProductions,
  getProductionById,
  createProduction,
  updateProduction,
  deleteProduction,
  updateProductionStatus,
  getProductionStats
};
