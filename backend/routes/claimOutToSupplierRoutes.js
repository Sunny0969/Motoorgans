const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimOutToSupplierController');

// Create a new claim out to supplier
router.post('/claims-out-to-supplier', claimController.createClaim);

// Get all claims out to supplier
router.get('/claims-out-to-supplier', claimController.getAllClaims);

// Get a specific claim by ID
router.get('/claims-out-to-supplier/:id', claimController.getClaimById);

// Update a claim
router.put('/claims-out-to-supplier/:id', claimController.updateClaim);

// Delete a claim
router.delete('/claims-out-to-supplier/:id', claimController.deleteClaim);

// Update claim status
router.patch('/claims-out-to-supplier/:id/status', claimController.updateClaimStatus);

module.exports = router;
