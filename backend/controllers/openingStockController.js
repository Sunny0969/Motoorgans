const {
  fetchLocations,
  getNextInvoiceNumber,
  getLatestOpeningStock,
  getOpeningStockByDoc,
  listOpeningStocks,
  getProductInfo,
  saveOpeningStock,
  deleteOpeningStock,
} = require('../services/openingStockService');

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
    const data = await getLatestOpeningStock();
    if (!data) {
      return res.status(404).json({ success: false, message: 'No opening stock records found.' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllOpeningStocks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const data = await listOpeningStocks(limit);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOpeningStockById = async (req, res) => {
  try {
    const data = await getOpeningStockByDoc(req.params.doc);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Opening stock not found' });
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

const getProduct = async (req, res) => {
  try {
    const data = await getProductInfo(req.params.productId);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createOpeningStock = async (req, res) => {
  try {
    const doc = req.body.doc ? Number(req.body.doc) : null;
    const saved = await saveOpeningStock(req.body, doc);
    res.status(201).json({
      success: true,
      message: `Opening stock #${saved.doc} saved successfully.`,
      data: saved,
    });
  } catch (error) {
    console.error('POST /api/opening-stock error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOpeningStock = async (req, res) => {
  try {
    const saved = await saveOpeningStock(req.body, req.params.doc);
    res.json({
      success: true,
      message: `Opening stock #${saved.doc} updated successfully.`,
      data: saved,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteOpeningStockHandler = async (req, res) => {
  try {
    await deleteOpeningStock(req.params.doc);
    res.json({ success: true, message: `Opening stock #${req.params.doc} deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNextNumber,
  getLatest,
  getAllOpeningStocks,
  getOpeningStockById,
  getLocations,
  getProduct,
  createOpeningStock,
  updateOpeningStock,
  deleteOpeningStock: deleteOpeningStockHandler,
};
