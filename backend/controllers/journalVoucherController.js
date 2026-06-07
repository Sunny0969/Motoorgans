const {
  getNextJournalDoc,
  fetchJournalVoucherByDoc,
  saveJournalVoucher,
  deleteJournalVoucher,
} = require('../services/journalVoucherService');

const getNextDoc = async (req, res) => {
  try {
    const nextDoc = await getNextJournalDoc();
    res.json({ nextDoc, docNumber: nextDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getByDoc = async (req, res) => {
  try {
    const data = await fetchJournalVoucherByDoc(req.params.doc);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Journal voucher not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createVoucher = async (req, res) => {
  try {
    const saved = await saveJournalVoucher(req.body, null);
    res.status(201).json({
      success: true,
      message: `Journal voucher #${saved.doc} saved successfully.`,
      data: saved,
    });
  } catch (error) {
    console.error('POST /api/journal-vouchers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateVoucher = async (req, res) => {
  try {
    const saved = await saveJournalVoucher(req.body, req.params.doc);
    res.json({
      success: true,
      message: `Journal voucher #${saved.doc} updated successfully.`,
      data: saved,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteVoucher = async (req, res) => {
  try {
    await deleteJournalVoucher(req.params.doc);
    res.json({ success: true, message: `Journal voucher #${req.params.doc} deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNextDoc,
  getByDoc,
  createVoucher,
  updateVoucher,
  deleteVoucher,
};
