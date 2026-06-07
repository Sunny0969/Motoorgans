const express = require('express');
const router = express.Router();
const {
  getClaims,
  getClaim,
  getLatest,
  getNextNumber,
  getSupplierBalance,
  createClaim,
  updateClaim,
  deleteClaim,
  searchClaims,
} = require('../controllers/claimOutToSupplierController');

router.get('/latest', getLatest);
router.get('/next-number', getNextNumber);
router.get('/search/:query', searchClaims);
router.get('/supplier/:id/balance', getSupplierBalance);
router.route('/').get(getClaims).post(createClaim);
router.route('/:id').get(getClaim).put(updateClaim).delete(deleteClaim);

module.exports = router;
