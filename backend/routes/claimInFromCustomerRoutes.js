const express = require('express');
const router = express.Router();
const {
  getClaimsInFromCustomer,
  getClaimInFromCustomer,
  createClaimInFromCustomer,
  updateClaimInFromCustomer,
  deleteClaimInFromCustomer,
  searchClaimsInFromCustomer,
  getClaimsByStatus,
  getClaimsByCustomer
} = require('../controllers/claimInFromCustomerController');

// Routes
router.route('/')
  .get(getClaimsInFromCustomer)
  .post(createClaimInFromCustomer);

router.route('/:id')
  .get(getClaimInFromCustomer)
  .put(updateClaimInFromCustomer)
  .delete(deleteClaimInFromCustomer);

router.route('/search/:query')
  .get(searchClaimsInFromCustomer);

router.route('/status/:status')
  .get(getClaimsByStatus);

router.route('/customer/:customerId')
  .get(getClaimsByCustomer);

module.exports = router;
