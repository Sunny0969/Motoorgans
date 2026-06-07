const {
  fetchPurchaseHeaders,
  fetchPurchaseByDoc,
  fetchLatestPurchase,
  createPurchase: createPurchaseInDB,
  updatePurchase: updatePurchaseInDB,
  deletePurchase: deletePurchaseInDB,
  fetchNextPurchaseDoc,
  fetchSupplierBalance,
  fetchProductPurchaseHistory,
} = require('../utils/mssqlRepository');

const getPurchases = async (req, res) => {
  try {
    const headers = await fetchPurchaseHeaders(15);
    const purchases = await Promise.all(
      headers.map((header) => fetchPurchaseByDoc(header.Doc)),
    );
    res.json(purchases.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPurchase = async (req, res) => {
  try {
    const purchase = await fetchPurchaseByDoc(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLatestPurchase = async (req, res) => {
  try {
    const purchase = await fetchLatestPurchase();
    if (!purchase) {
      return res.status(404).json({ message: 'No purchases found' });
    }
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNextNumber = async (req, res) => {
  try {
    const nextDoc = await fetchNextPurchaseDoc();
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
    const history = await fetchProductPurchaseHistory(req.params.productId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPurchase = async (req, res) => {
  try {
    const purchase = await createPurchaseInDB(req.body);
    res.status(201).json({
      message: `Purchase #${purchase.invoiceNo || purchase.id} saved successfully.`,
      ...purchase,
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ message: 'Failed to save purchase: ' + error.message });
  }
};

const updatePurchase = async (req, res) => {
  try {
    const purchase = await updatePurchaseInDB(req.params.id, req.body);
    res.json({
      message: `Purchase #${purchase.invoiceNo || purchase.id} updated successfully.`,
      ...purchase,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePurchase = async (req, res) => {
  try {
    await deletePurchaseInDB(req.params.id);
    res.json({ success: true, message: `Purchase #${req.params.id} deleted.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchPurchases = async (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const headers = await fetchPurchaseHeaders(200);
    const matches = headers.filter((row) => {
      const invoice = row.invoice != null ? String(row.invoice).toLowerCase() : '';
      const doc = String(row.Doc).toLowerCase();
      return invoice.includes(query) || doc.includes(query);
    });

    const purchases = await Promise.all(
      matches.slice(0, 10).map((header) => fetchPurchaseByDoc(header.Doc)),
    );
    res.json(purchases.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPurchases,
  getPurchase,
  getLatestPurchase,
  getNextNumber,
  getSupplierBalance,
  getProductHistory,
  createPurchase,
  updatePurchase,
  deletePurchase,
  searchPurchases,
};
