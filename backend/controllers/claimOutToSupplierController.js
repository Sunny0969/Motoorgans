const {
  fetchClaimOutHeaders,
  fetchClaimOutByDoc,
  fetchLatestClaimOut,
  createClaimOut,
  updateClaimOut,
  deleteClaimOut,
  fetchNextClaimOutDoc,
  fetchSupplierBalance,
} = require('../utils/mssqlRepository');

const getClaims = async (req, res) => {
  try {
    const headers = await fetchClaimOutHeaders(15);
    const list = await Promise.all(headers.map((h) => fetchClaimOutByDoc(h.Doc)));
    res.json(list.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClaim = async (req, res) => {
  try {
    const row = await fetchClaimOutByDoc(req.params.id);
    if (!row) return res.status(404).json({ message: 'Claim out not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLatest = async (req, res) => {
  try {
    const row = await fetchLatestClaimOut();
    if (!row) return res.status(404).json({ message: 'No claim out vouchers found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNextNumber = async (req, res) => {
  try {
    const nextDoc = await fetchNextClaimOutDoc();
    res.json({ nextDoc, invoiceNo: String(nextDoc) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSupplierBalance = async (req, res) => {
  try {
    const balance = await fetchSupplierBalance(req.params.id);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createClaim = async (req, res) => {
  try {
    const saved = await createClaimOut(req.body);
    res.status(201).json({
      message: `Claim Out #${saved.invoiceNo || saved.id} saved successfully.`,
      ...saved,
    });
  } catch (error) {
    console.error('Error creating claim out:', error);
    res.status(500).json({ message: 'Failed to save: ' + error.message });
  }
};

const updateClaim = async (req, res) => {
  try {
    const saved = await updateClaimOut(req.params.id, req.body);
    res.json({
      message: `Claim Out #${saved.invoiceNo || saved.id} updated successfully.`,
      ...saved,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteClaim = async (req, res) => {
  try {
    await deleteClaimOut(req.params.id);
    res.json({ success: true, message: `Claim Out #${req.params.id} deleted.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchClaims = async (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const headers = await fetchClaimOutHeaders(200);
    const matches = headers.filter((row) => {
      const invoice = row.invoice != null ? String(row.invoice).toLowerCase() : '';
      const doc = String(row.Doc).toLowerCase();
      return invoice.includes(query) || doc.includes(query);
    });
    const list = await Promise.all(
      matches.slice(0, 10).map((h) => fetchClaimOutByDoc(h.Doc)),
    );
    res.json(list.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getClaims,
  getClaim,
  getLatest,
  getNextNumber,
  getSupplierBalance,
  createClaim,
  updateClaim,
  deleteClaim,
  searchClaims,
};
