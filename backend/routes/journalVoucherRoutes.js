const express = require('express');
const router = express.Router();
const {
  getNextDoc,
  getByDoc,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} = require('../controllers/journalVoucherController');

router.get('/next-doc', getNextDoc);

router.route('/')
  .post(createVoucher);

router.route('/:doc')
  .get(getByDoc)
  .put(updateVoucher)
  .delete(deleteVoucher);

module.exports = router;
