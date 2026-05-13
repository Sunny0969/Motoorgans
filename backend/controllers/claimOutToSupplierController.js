const ClaimOutToSupplier = require('../models/ClaimOutToSupplier');

// Create a new claim out to supplier
exports.createClaim = async (req, res) => {
  try {
    const claimData = req.body;

    // Calculate totals
    const totalItems = claimData.items.length;
    const totalClaimedQty = claimData.items.reduce((sum, item) => sum + (parseFloat(item.claimedQty) || 0), 0);
    const totalClaimAmount = claimData.items.reduce((sum, item) => sum + (parseFloat(item.claimAmount) || 0), 0);

    claimData.summary = {
      totalItems,
      totalClaimedQty,
      totalClaimAmount,
      settlementAmount: totalClaimAmount
    };

    const claim = new ClaimOutToSupplier(claimData);
    await claim.save();

    res.status(201).json({
      message: 'Claim out to supplier created successfully',
      claim
    });
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({
      message: 'Error creating claim',
      error: error.message
    });
  }
};

// Get all claims out to supplier
exports.getAllClaims = async (req, res) => {
  try {
    const claims = await ClaimOutToSupplier.find().sort({ createdAt: -1 });
    res.status(200).json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({
      message: 'Error fetching claims',
      error: error.message
    });
  }
};

// Get a specific claim by ID
exports.getClaimById = async (req, res) => {
  try {
    const claim = await ClaimOutToSupplier.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.status(200).json(claim);
  } catch (error) {
    console.error('Error fetching claim:', error);
    res.status(500).json({
      message: 'Error fetching claim',
      error: error.message
    });
  }
};

// Update a claim
exports.updateClaim = async (req, res) => {
  try {
    const claimData = req.body;

    // Recalculate totals if items are updated
    if (claimData.items) {
      const totalItems = claimData.items.length;
      const totalClaimedQty = claimData.items.reduce((sum, item) => sum + (parseFloat(item.claimedQty) || 0), 0);
      const totalClaimAmount = claimData.items.reduce((sum, item) => sum + (parseFloat(item.claimAmount) || 0), 0);

      claimData.summary = {
        totalItems,
        totalClaimedQty,
        totalClaimAmount,
        settlementAmount: totalClaimAmount
      };
    }

    const claim = await ClaimOutToSupplier.findByIdAndUpdate(
      req.params.id,
      claimData,
      { new: true, runValidators: true }
    );

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    res.status(200).json({
      message: 'Claim updated successfully',
      claim
    });
  } catch (error) {
    console.error('Error updating claim:', error);
    res.status(500).json({
      message: 'Error updating claim',
      error: error.message
    });
  }
};

// Delete a claim
exports.deleteClaim = async (req, res) => {
  try {
    const claim = await ClaimOutToSupplier.findByIdAndDelete(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.status(200).json({ message: 'Claim deleted successfully' });
  } catch (error) {
    console.error('Error deleting claim:', error);
    res.status(500).json({
      message: 'Error deleting claim',
      error: error.message
    });
  }
};

// Update claim status
exports.updateClaimStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const claim = await ClaimOutToSupplier.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    res.status(200).json({
      message: 'Claim status updated successfully',
      claim
    });
  } catch (error) {
    console.error('Error updating claim status:', error);
    res.status(500).json({
      message: 'Error updating claim status',
      error: error.message
    });
  }
};
