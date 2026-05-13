const ClaimInFromCustomer = require('../models/ClaimInFromCustomer');

// @desc    Get all claims in from customer
// @route   GET /api/claims-in-from-customer
// @access  Public
const getClaimsInFromCustomer = async (req, res) => {
  try {
    const claims = await ClaimInFromCustomer.find({})
      .populate('customer', 'name code')
      .populate('originalSale', 'saleNumber')
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single claim in from customer
// @route   GET /api/claims-in-from-customer/:id
// @access  Public
const getClaimInFromCustomer = async (req, res) => {
  try {
    const claim = await ClaimInFromCustomer.findById(req.params.id)
      .populate('customer', 'name code address phone email')
      .populate('originalSale', 'saleNumber date');
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create claim in from customer
// @route   POST /api/claims-in-from-customer
// @access  Public
const createClaimInFromCustomer = async (req, res) => {
  try {
    const {
      claimNumber,
      date,
      claimDate,
      originalSale,
      customer,
      customerReference,
      claimType,
      claimReason,
      priority,
      receivedBy,
      approvedBy,
      status,
      resolution,
      notes,
      items,
      summary
    } = req.body;

    const claim = new ClaimInFromCustomer({
      claimNumber,
      date,
      claimDate,
      originalSale,
      customer,
      customerReference,
      claimType,
      claimReason,
      priority,
      receivedBy,
      approvedBy,
      status,
      resolution,
      notes,
      items,
      summary
    });

    const createdClaim = await claim.save();
    const populatedClaim = await ClaimInFromCustomer.findById(createdClaim._id)
      .populate('customer', 'name code')
      .populate('originalSale', 'saleNumber');

    res.status(201).json(populatedClaim);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Claim number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update claim in from customer
// @route   PUT /api/claims-in-from-customer/:id
// @access  Public
const updateClaimInFromCustomer = async (req, res) => {
  try {
    const claim = await ClaimInFromCustomer.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const {
      claimNumber,
      date,
      claimDate,
      originalSale,
      customer,
      customerReference,
      claimType,
      claimReason,
      priority,
      receivedBy,
      approvedBy,
      status,
      resolution,
      notes,
      items,
      summary
    } = req.body;

    claim.claimNumber = claimNumber || claim.claimNumber;
    claim.date = date || claim.date;
    claim.claimDate = claimDate || claim.claimDate;
    claim.originalSale = originalSale || claim.originalSale;
    claim.customer = customer || claim.customer;
    claim.customerReference = customerReference || claim.customerReference;
    claim.claimType = claimType || claim.claimType;
    claim.claimReason = claimReason || claim.claimReason;
    claim.priority = priority || claim.priority;
    claim.receivedBy = receivedBy || claim.receivedBy;
    claim.approvedBy = approvedBy || claim.approvedBy;
    claim.status = status || claim.status;
    claim.resolution = resolution || claim.resolution;
    claim.notes = notes || claim.notes;
    claim.items = items || claim.items;
    claim.summary = summary || claim.summary;

    const updatedClaim = await claim.save();
    const populatedClaim = await ClaimInFromCustomer.findById(updatedClaim._id)
      .populate('customer', 'name code')
      .populate('originalSale', 'saleNumber');

    res.json(populatedClaim);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Claim number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete claim in from customer
// @route   DELETE /api/claims-in-from-customer/:id
// @access  Public
const deleteClaimInFromCustomer = async (req, res) => {
  try {
    const claim = await ClaimInFromCustomer.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    await ClaimInFromCustomer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Claim deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search claims in from customer
// @route   GET /api/claims-in-from-customer/search/:query
// @access  Public
const searchClaimsInFromCustomer = async (req, res) => {
  try {
    const query = req.params.query;
    const claims = await ClaimInFromCustomer.find({
      $or: [
        { claimNumber: { $regex: query, $options: 'i' } },
        { customerReference: { $regex: query, $options: 'i' } },
        { notes: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('customer', 'name code')
      .populate('originalSale', 'saleNumber')
      .limit(10);
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get claims by status
// @route   GET /api/claims-in-from-customer/status/:status
// @access  Public
const getClaimsByStatus = async (req, res) => {
  try {
    const claims = await ClaimInFromCustomer.find({ status: req.params.status })
      .populate('customer', 'name code')
      .populate('originalSale', 'saleNumber')
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get claims by customer
// @route   GET /api/claims-in-from-customer/customer/:customerId
// @access  Public
const getClaimsByCustomer = async (req, res) => {
  try {
    const claims = await ClaimInFromCustomer.find({ customer: req.params.customerId })
      .populate('customer', 'name code')
      .populate('originalSale', 'saleNumber')
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getClaimsInFromCustomer,
  getClaimInFromCustomer,
  createClaimInFromCustomer,
  updateClaimInFromCustomer,
  deleteClaimInFromCustomer,
  searchClaimsInFromCustomer,
  getClaimsByStatus,
  getClaimsByCustomer
};
