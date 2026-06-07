const express = require('express');
const router = express.Router();
const {
  getClaims,
  getClaim,
  getLatest,
  getNextNumber,
  getCustomerBalance,
  createClaim,
  updateClaim,
  deleteClaim,
  searchClaims,
} = require('../controllers/claimInFromCustomerController');

router.get('/latest', getLatest);
router.get('/next-number', getNextNumber);
router.get('/search/:query', searchClaims);
router.get('/customer/:id/balance', getCustomerBalance);
router.route('/').get(getClaims).post(createClaim);
router.route('/:id').get(getClaim).put(updateClaim).delete(deleteClaim);

module.exports = router;
