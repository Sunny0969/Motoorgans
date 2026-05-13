const express = require('express');
const router = express.Router();
const {
  getSMSBalance,
  updateSMSBalance,
  getSMSHistory,
  addSMSHistory,
  deleteSMSHistory,
  resendSMS,
  clearSMSHistory,
  exportSMSHistory,
  getTopUpPlans,
  createTopUpPlan,
  processTopUp,
  getSMSStatistics,
  sendTestSMS,
  getCustomerGroups,
  sendSMS,
  scheduleSMS,
  getSMSCampaigns,
  cancelSMSCampaign,
  buySMSCredits
} = require('../controllers/smsController');

// Routes
router.route('/balance')
  .get(getSMSBalance)
  .put(updateSMSBalance);

router.route('/history')
  .get(getSMSHistory)
  .post(addSMSHistory)
  .delete(clearSMSHistory);

router.route('/history/:id')
  .delete(deleteSMSHistory);

router.route('/resend/:id')
  .post(resendSMS);

router.route('/export-history')
  .get(exportSMSHistory);

router.route('/topup-plans')
  .get(getTopUpPlans)
  .post(createTopUpPlan);

router.route('/topup')
  .post(processTopUp);

router.route('/statistics')
  .get(getSMSStatistics);

router.route('/test')
  .post(sendTestSMS);

router.route('/customer-groups')
  .get(getCustomerGroups);

router.route('/send')
  .post(sendSMS);

router.route('/schedule')
  .post(scheduleSMS);

router.route('/campaigns')
  .get(getSMSCampaigns);

router.route('/campaigns/:id')
  .delete(cancelSMSCampaign);

router.route('/buy-credits')
  .post(buySMSCredits);

module.exports = router;
