const express = require('express');
const router = express.Router();
const {
  getDayCloses,
  getDayClose,
  getDayCloseByDate,
  generateDayClose,
  updateDayClose,
  verifyCashier,
  verifyManager,
  reopenDayClose,
  getDayCloseSummary
} = require('../controllers/dayCloseController');

// Routes
router.route('/')
  .get(getDayCloses)
  .post(generateDayClose);

router.route('/:id')
  .get(getDayClose)
  .put(updateDayClose);

router.route('/by-date/:date/:shift')
  .get(getDayCloseByDate);

router.route('/:id/verify/cashier')
  .post(verifyCashier);

router.route('/:id/verify/manager')
  .post(verifyManager);

router.route('/:id/reopen')
  .post(reopenDayClose);

router.route('/summary')
  .get(getDayCloseSummary);

module.exports = router;
