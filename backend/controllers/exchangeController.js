const {
  fetchLocations,
  fetchAvailableStock,
  getNextInvoiceNumber,
  getLatestExchange,
  getExchangeByDoc,
  listExchanges,
  getProductInfo,
  getCustomerInfo,
  saveExchange,
  deleteExchange,
  fetchCustomers,
} = require('../services/exchangeService');

const getNextNumber = async (req, res) => {
  try {
    const nextNumber = await getNextInvoiceNumber();
    res.json({ nextNumber, invoiceNo: nextNumber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLatest = async (req, res) => {
  try {
    const data = await getLatestExchange();
    if (!data) {
      return res.status(404).json({ success: false, message: 'No exchange records found.' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const data = await listExchanges(limit);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getByDoc = async (req, res) => {
  try {
    const data = await getExchangeByDoc(req.params.doc);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Exchange not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLocations = async (req, res) => {
  try {
    const data = await fetchLocations();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomers = async (req, res) => {
  try {
    const data = await fetchCustomers();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomer = async (req, res) => {
  try {
    const data = await getCustomerInfo(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const data = await getProductInfo(
      req.params.productId,
      req.query.locationId,
    );
    if (!data) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAvailable = async (req, res) => {
  try {
    const stock = await fetchAvailableStock(
      req.params.productId,
      req.query.locationId,
    );
    res.json({ availableStock: stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createExchange = async (req, res) => {
  try {
    const saved = await saveExchange(req.body, null);
    res.status(201).json({
      success: true,
      message: `Exchange #${saved.doc} saved successfully.`,
      data: saved,
    });
  } catch (error) {
    console.error('POST /api/exchanges error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateExchange = async (req, res) => {
  try {
    const saved = await saveExchange(req.body, req.params.doc);
    res.json({
      success: true,
      message: `Exchange #${saved.doc} updated successfully.`,
      data: saved,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExchangeHandler = async (req, res) => {
  try {
    await deleteExchange(req.params.doc);
    res.json({ success: true, message: `Exchange #${req.params.doc} deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNextNumber,
  getLatest,
  getAll,
  getByDoc,
  getLocations,
  getCustomers,
  getCustomer,
  getProduct,
  getAvailable,
  createExchange,
  updateExchange,
  deleteExchange: deleteExchangeHandler,
};
