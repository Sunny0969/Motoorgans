const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/demandOrderController');

// Routes
router.route('/')
  .get(getDemandOrders)
  .post(createDemandOrder);

router.route('/summary')
  .get(getDemandOrderSummary);

router.route('/number/:demandNumber')
  .get(getDemandOrderByNumber);

router.route('/:id')
  .get(getDemandOrder)
  .put(updateDemandOrder)
  .delete(deleteDemandOrder);

router.route('/:id/approve')
  .post(approveDemandOrder);

router.route('/:id/reject')
  .post(rejectDemandOrder);

router.route('/:id/complete')
  .post(completeDemandOrder);

module.exports = router;
