const {
  fetchClaimInHeaders,
  fetchClaimInByDoc,
  fetchLatestClaimIn,
  createClaimIn,
  updateClaimIn,
  deleteClaimIn,
  fetchNextClaimInDoc,
  fetchCustomerBalance,
} = require('../utils/mssqlRepository');

const getClaims = async (req, res) => {
  try {
    const headers = await fetchClaimInHeaders(15);
    const list = await Promise.all(headers.map((h) => fetchClaimInByDoc(h.Doc)));
    res.json(list.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClaim = async (req, res) => {
  try {
    const row = await fetchClaimInByDoc(req.params.id);
    if (!row) return res.status(404).json({ message: 'Claim in not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLatest = async (req, res) => {
  try {
    const row = await fetchLatestClaimIn();
    if (!row) return res.status(404).json({ message: 'No claim in vouchers found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNextNumber = async (req, res) => {
  try {
    const nextDoc = await fetchNextClaimInDoc();
    res.json({ nextDoc, invoiceNo: String(nextDoc) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCustomerBalance = async (req, res) => {
  try {
    const balance = await fetchCustomerBalance(req.params.id);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createClaim = async (req, res) => {
  try {
    const saved = await createClaimIn(req.body);
    res.status(201).json({
      message: `Claim In #${saved.invoiceNo || saved.id} saved successfully.`,
      ...saved,
    });
  } catch (error) {
    console.error('Error creating claim in:', error);
    res.status(500).json({ message: 'Failed to save: ' + error.message });
  }
};

const updateClaim = async (req, res) => {
  try {
    const saved = await updateClaimIn(req.params.id, req.body);
    res.json({
      message: `Claim In #${saved.invoiceNo || saved.id} updated successfully.`,
      ...saved,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteClaim = async (req, res) => {
  try {
    await deleteClaimIn(req.params.id);
    res.json({ success: true, message: `Claim In #${req.params.id} deleted.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchClaims = async (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const headers = await fetchClaimInHeaders(200);
    const matches = headers.filter((row) => {
      const invoice = row.invoice != null ? String(row.invoice).toLowerCase() : '';
      const doc = String(row.Doc).toLowerCase();
      return invoice.includes(query) || doc.includes(query);
    });
    const list = await Promise.all(
      matches.slice(0, 10).map((h) => fetchClaimInByDoc(h.Doc)),
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
  getCustomerBalance,
  createClaim,
  updateClaim,
  deleteClaim,
  searchClaims,
};
