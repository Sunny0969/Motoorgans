const {
  fetchSaleReturnHeaders,
  fetchSaleReturnByDoc,
  fetchLatestSaleReturn,
  createSaleReturn,
  updateSaleReturn,
  deleteSaleReturn,
  fetchNextSaleReturnDoc,
  fetchCustomerBalance,
} = require('../utils/mssqlRepository');

const getSaleReturns = async (req, res) => {
  try {
    const headers = await fetchSaleReturnHeaders(15);
    const list = await Promise.all(headers.map((h) => fetchSaleReturnByDoc(h.Doc)));
    res.json(list.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSaleReturn = async (req, res) => {
  try {
    const row = await fetchSaleReturnByDoc(req.params.id);
    if (!row) return res.status(404).json({ message: 'Sale return not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLatest = async (req, res) => {
  try {
    const row = await fetchLatestSaleReturn();
    if (!row) return res.status(404).json({ message: 'No sale returns found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNextNumber = async (req, res) => {
  try {
    const nextDoc = await fetchNextSaleReturnDoc();
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

const createReturn = async (req, res) => {
  try {
    const saved = await createSaleReturn(req.body);
    res.status(201).json({
      message: `Sale Return #${saved.invoiceNo || saved.id} saved successfully.`,
      ...saved,
    });
  } catch (error) {
    console.error('Error creating sale return:', error);
    res.status(500).json({ message: 'Failed to save: ' + error.message });
  }
};

const updateReturn = async (req, res) => {
  try {
    const saved = await updateSaleReturn(req.params.id, req.body);
    res.json({
      message: `Sale Return #${saved.invoiceNo || saved.id} updated successfully.`,
      ...saved,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReturn = async (req, res) => {
  try {
    await deleteSaleReturn(req.params.id);
    res.json({ success: true, message: `Sale Return #${req.params.id} deleted.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchSaleReturns = async (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const headers = await fetchSaleReturnHeaders(200);
    const matches = headers.filter((row) => {
      const invoice = row.invoice != null ? String(row.invoice).toLowerCase() : '';
      const doc = String(row.Doc).toLowerCase();
      return invoice.includes(query) || doc.includes(query);
    });
    const list = await Promise.all(
      matches.slice(0, 10).map((h) => fetchSaleReturnByDoc(h.Doc)),
    );
    res.json(list.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSaleReturns,
  getSaleReturn,
  getLatest,
  getNextNumber,
  getCustomerBalance,
  createReturn,
  updateReturn,
  deleteReturn,
  searchSaleReturns,
};
