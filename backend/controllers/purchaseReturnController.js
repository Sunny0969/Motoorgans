const {
  fetchPurchaseReturnHeaders,
  fetchPurchaseReturnByDoc,
  fetchLatestPurchaseReturn,
  createPurchaseReturn,
  updatePurchaseReturn,
  deletePurchaseReturn,
  fetchNextPurchaseReturnDoc,
  fetchSupplierBalance,
  fetchProductPurchaseReturnHistory,
} = require('../utils/mssqlRepository');

const getPurchaseReturns = async (req, res) => {
  try {
    const headers = await fetchPurchaseReturnHeaders(15);
    const list = await Promise.all(
      headers.map((h) => fetchPurchaseReturnByDoc(h.Doc)),
    );
    res.json(list.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPurchaseReturn = async (req, res) => {
  try {
    const row = await fetchPurchaseReturnByDoc(req.params.id);
    if (!row) return res.status(404).json({ message: 'Purchase return not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLatestPurchaseReturn = async (req, res) => {
  try {
    const row = await fetchLatestPurchaseReturn();
    if (!row) return res.status(404).json({ message: 'No purchase returns found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNextNumber = async (req, res) => {
  try {
    const nextDoc = await fetchNextPurchaseReturnDoc();
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

const getProductHistory = async (req, res) => {
  try {
    const history = await fetchProductPurchaseReturnHistory(req.params.productId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createReturn = async (req, res) => {
  try {
    const saved = await createPurchaseReturn(req.body);
    res.status(201).json({
      message: `Purchase Return #${saved.invoiceNo || saved.id} saved successfully.`,
      ...saved,
    });
  } catch (error) {
    console.error('Error creating purchase return:', error);
    res.status(500).json({ message: 'Failed to save: ' + error.message });
  }
};

const updateReturn = async (req, res) => {
  try {
    const saved = await updatePurchaseReturn(req.params.id, req.body);
    res.json({
      message: `Purchase Return #${saved.invoiceNo || saved.id} updated successfully.`,
      ...saved,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReturn = async (req, res) => {
  try {
    await deletePurchaseReturn(req.params.id);
    res.json({ success: true, message: `Purchase Return #${req.params.id} deleted.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchPurchaseReturns = async (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const headers = await fetchPurchaseReturnHeaders(200);
    const matches = headers.filter((row) => {
      const invoice = row.invoice != null ? String(row.invoice).toLowerCase() : '';
      const doc = String(row.Doc).toLowerCase();
      return invoice.includes(query) || doc.includes(query);
    });
    const list = await Promise.all(
      matches.slice(0, 10).map((h) => fetchPurchaseReturnByDoc(h.Doc)),
    );
    res.json(list.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPurchaseReturns,
  getPurchaseReturn,
  getLatestPurchaseReturn,
  getNextNumber,
  getSupplierBalance,
  getProductHistory,
  createReturn,
  updateReturn,
  deleteReturn,
  searchPurchaseReturns,
};
