const DemandOrder = require('../models/DemandOrder');
const Product = require('../models/Product');
const Employee = require('../models/Employee');
const Location = require('../models/Location');

// @desc    Get all demand orders
// @route   GET /api/demand-orders
// @access  Public
const getDemandOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.requestedBy) filter.requestedBy = req.query.requestedBy;
    if (req.query.fromLocation) filter.fromLocation = req.query.fromLocation;
    if (req.query.toLocation) filter.toLocation = req.query.toLocation;
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const demandOrders = await DemandOrder.find(filter)
      .populate('requestedBy', 'name code')
      .populate('fromLocation', 'name code')
      .populate('toLocation', 'name code')
      .populate('approvals.approvedBy', 'name code')
      .populate('approvals.rejectedBy', 'name code')
      .populate('createdBy', 'name code')
      .populate('items.product', 'name code description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DemandOrder.countDocuments(filter);

    res.json({
      success: true,
      data: demandOrders,
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

// @desc    Get single demand order
// @route   GET /api/demand-orders/:id
// @access  Public
const getDemandOrder = async (req, res) => {
  try {
    const demandOrder = await DemandOrder.findById(req.params.id)
      .populate('requestedBy', 'name code')
      .populate('fromLocation', 'name code')
      .populate('toLocation', 'name code')
      .populate('approvals.approvedBy', 'name code')
      .populate('approvals.rejectedBy', 'name code')
      .populate('createdBy', 'name code')
      .populate('items.product', 'name code description currentStock uom');

    if (!demandOrder) {
      return res.status(404).json({
        success: false,
        message: 'Demand order not found'
      });
    }

    res.json({
      success: true,
      data: demandOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get demand order by demand number
// @route   GET /api/demand-orders/number/:demandNumber
// @access  Public
const getDemandOrderByNumber = async (req, res) => {
  try {
    const demandOrder = await DemandOrder.findOne({ demandNumber: req.params.demandNumber })
      .populate('requestedBy', 'name code')
      .populate('fromLocation', 'name code')
      .populate('toLocation', 'name code')
      .populate('approvals.approvedBy', 'name code')
      .populate('approvals.rejectedBy', 'name code')
      .populate('createdBy', 'name code')
      .populate('items.product', 'name code description currentStock uom');

    if (!demandOrder) {
      return res.status(404).json({
        success: false,
        message: 'Demand order not found'
      });
    }

    res.json({
      success: true,
      data: demandOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new demand order
// @route   POST /api/demand-orders
// @access  Public
const createDemandOrder = async (req, res) => {
  try {
    const {
      demandNumber,
      date,
      requiredDate,
      requestedBy,
      department,
      fromLocation,
      toLocation,
      priority,
      items,
      notes,
      createdBy
    } = req.body;

    // Validate required fields
    if (!demandNumber || !date || !requiredDate || !requestedBy || !department || !fromLocation || !toLocation || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if demand number already exists
    const existingOrder = await DemandOrder.findOne({ demandNumber });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: 'Demand order number already exists'
      });
    }

    // Validate requestedBy exists
    const requester = await Employee.findById(requestedBy);
    if (!requester) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requester'
      });
    }

    // Validate locations exist
    const fromLoc = await Location.findById(fromLocation);
    const toLoc = await Location.findById(toLocation);
    if (!fromLoc || !toLoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location(s)'
      });
    }

    // Validate and enrich items with product details and current stock
    const enrichedItems = [];
    for (const item of items) {
      if (!item.product || !item.requiredQty) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have a product and required quantity'
        });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      enrichedItems.push({
        sr: item.sr || enrichedItems.length + 1,
        productCode: product.code,
        product: product._id,
        productName: product.name,
        description: item.description || product.description,
        currentStock: product.currentStock || 0,
        requiredQty: item.requiredQty,
        uom: item.uom || product.uom || 'PC',
        remarks: item.remarks
      });
    }

    // Create demand order
    const demandOrder = new DemandOrder({
      demandNumber,
      date: new Date(date),
      requiredDate: new Date(requiredDate),
      requestedBy,
      requestedByDetails: {
        name: requester.name,
        code: requester.code
      },
      department,
      fromLocation,
      fromLocationDetails: {
        name: fromLoc.name,
        code: fromLoc.code
      },
      toLocation,
      toLocationDetails: {
        name: toLoc.name,
        code: toLoc.code
      },
      priority: priority || 'Normal',
      items: enrichedItems,
      notes,
      createdBy
    });

    const savedOrder = await demandOrder.save();
    await savedOrder.populate([
      { path: 'requestedBy', select: 'name code' },
      { path: 'fromLocation', select: 'name code' },
      { path: 'toLocation', select: 'name code' },
      { path: 'createdBy', select: 'name code' },
      { path: 'items.product', select: 'name code description currentStock uom' }
    ]);

    res.status(201).json({
      success: true,
      data: savedOrder,
      message: 'Demand order created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update demand order
// @route   PUT /api/demand-orders/:id
// @access  Public
const updateDemandOrder = async (req, res) => {
  try {
    const demandOrder = await DemandOrder.findById(req.params.id);

    if (!demandOrder) {
      return res.status(404).json({
        success: false,
        message: 'Demand order not found'
      });
    }

    // Prevent updates if already approved/rejected
    if (['Approved', 'Rejected', 'Completed'].includes(demandOrder.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update approved, rejected, or completed demand orders'
      });
    }

    const allowedUpdates = [
      'requiredDate', 'department', 'priority', 'items', 'notes'
    ];

    // Handle items update with validation
    if (req.body.items) {
      const enrichedItems = [];
      for (const item of req.body.items) {
        if (!item.product || !item.requiredQty) {
          return res.status(400).json({
            success: false,
            message: 'Each item must have a product and required quantity'
          });
        }

        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product not found: ${item.product}`
          });
        }

        enrichedItems.push({
          sr: item.sr || enrichedItems.length + 1,
          productCode: product.code,
          product: product._id,
          productName: product.name,
          description: item.description || product.description,
          currentStock: product.currentStock || 0,
          requiredQty: item.requiredQty,
          uom: item.uom || product.uom || 'PC',
          remarks: item.remarks
        });
      }
      demandOrder.items = enrichedItems;
    }

    // Update other allowed fields
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined && field !== 'items') {
        if (field === 'requiredDate') {
          demandOrder[field] = new Date(req.body[field]);
        } else {
          demandOrder[field] = req.body[field];
        }
      }
    });

    if (req.body.updatedBy) {
      demandOrder.updatedBy = req.body.updatedBy;
    }

    const updatedOrder = await demandOrder.save();
    await updatedOrder.populate([
      { path: 'requestedBy', select: 'name code' },
      { path: 'fromLocation', select: 'name code' },
      { path: 'toLocation', select: 'name code' },
      { path: 'createdBy', select: 'name code' },
      { path: 'items.product', select: 'name code description currentStock uom' }
    ]);

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Demand order updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Approve demand order
// @route   POST /api/demand-orders/:id/approve
// @access  Public
const approveDemandOrder = async (req, res) => {
  try {
    const { approvedBy, notes } = req.body;

    const demandOrder = await DemandOrder.findById(req.params.id);

    if (!demandOrder) {
      return res.status(404).json({
        success: false,
        message: 'Demand order not found'
      });
    }

    if (demandOrder.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Demand order is not in pending status'
      });
    }

    // Validate approver exists
    const approver = await Employee.findById(approvedBy);
    if (!approver) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approver'
      });
    }

    demandOrder.status = 'Approved';
    demandOrder.approvals = {
      approvedBy,
      approvedByDetails: {
        name: approver.name,
        code: approver.code
      },
      approvedAt: new Date()
    };

    if (notes) {
      demandOrder.notes = `${demandOrder.notes || ''}\nApproval Notes: ${notes}`.trim();
    }

    await demandOrder.save();

    res.json({
      success: true,
      message: 'Demand order approved successfully',
      data: demandOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Reject demand order
// @route   POST /api/demand-orders/:id/reject
// @access  Public
const rejectDemandOrder = async (req, res) => {
  try {
    const { rejectedBy, rejectionReason } = req.body;

    const demandOrder = await DemandOrder.findById(req.params.id);

    if (!demandOrder) {
      return res.status(404).json({
        success: false,
        message: 'Demand order not found'
      });
    }

    if (demandOrder.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Demand order is not in pending status'
      });
    }

    // Validate rejector exists
    const rejector = await Employee.findById(rejectedBy);
    if (!rejector) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rejector'
      });
    }

    demandOrder.status = 'Rejected';
    demandOrder.approvals = {
      rejectedBy,
      rejectedByDetails: {
        name: rejector.name,
        code: rejector.code
      },
      rejectedAt: new Date(),
      rejectionReason
    };

    await demandOrder.save();

    res.json({
      success: true,
      message: 'Demand order rejected successfully',
      data: demandOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Mark demand order as completed
// @route   POST /api/demand-orders/:id/complete
// @access  Public
const completeDemandOrder = async (req, res) => {
  try {
    const demandOrder = await DemandOrder.findById(req.params.id);

    if (!demandOrder) {
      return res.status(404).json({
        success: false,
        message: 'Demand order not found'
      });
    }

    if (demandOrder.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved demand orders can be marked as completed'
      });
    }

    demandOrder.status = 'Completed';
    await demandOrder.save();

    res.json({
      success: true,
      message: 'Demand order marked as completed',
      data: demandOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete demand order
// @route   DELETE /api/demand-orders/:id
// @access  Public
const deleteDemandOrder = async (req, res) => {
  try {
    const demandOrder = await DemandOrder.findById(req.params.id);

    if (!demandOrder) {
      return res.status(404).json({
        success: false,
        message: 'Demand order not found'
      });
    }

    // Only allow deletion of pending orders
    if (demandOrder.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete non-pending demand orders'
      });
    }

    await DemandOrder.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Demand order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get demand order summary
// @route   GET /api/demand-orders/summary
// @access  Public
const getDemandOrderSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const summary = await DemandOrder.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalItems: { $sum: '$summary.totalItems' },
          totalQuantity: { $sum: '$summary.totalQuantity' }
        }
      }
    ]);

    const totalOrders = await DemandOrder.countDocuments(filter);

    res.json({
      success: true,
      data: {
        totalOrders,
        byStatus: summary,
        summary: summary.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            totalItems: item.totalItems,
            totalQuantity: item.totalQuantity
          };
          return acc;
        }, {})
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
  getDemandOrders,
  getDemandOrder,
  getDemandOrderByNumber,
  createDemandOrder,
  updateDemandOrder,
  approveDemandOrder,
  rejectDemandOrder,
  completeDemandOrder,
  deleteDemandOrder,
  getDemandOrderSummary
};
