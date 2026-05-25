const {
  fetchPurchaseHeaders,
  fetchPurchaseByDoc,
  fetchLatestPurchase,
  createPurchase: createPurchaseInDB,
} = require('../utils/mssqlRepository');

const getPurchases = async (req, res) => {
  try {
    const headers = await fetchPurchaseHeaders(15);
    const purchases = await Promise.all(
      headers.map((header) => fetchPurchaseByDoc(header.Doc))
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

const createPurchase = async (req, res) => {
  try {
    const purchase = await createPurchaseInDB(req.body);
    res.status(201).json(purchase);
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ message: 'Failed to save purchase: ' + error.message });
  }
};

const updatePurchase = async (req, res) => {
  res.status(501).json({ message: 'Update purchase is not implemented for SQL Server yet.' });
};

const deletePurchase = async (req, res) => {
  res.status(501).json({ message: 'Delete purchase is not implemented for SQL Server yet.' });
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
      matches.slice(0, 10).map((header) => fetchPurchaseByDoc(header.Doc))
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
  createPurchase,
  updatePurchase,
  deletePurchase,
  searchPurchases,
};
