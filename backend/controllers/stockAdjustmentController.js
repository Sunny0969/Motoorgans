const {
  fetchLocations,
  fetchAvailableStock,
  getNextInvoiceNumber,
  getLatestStockAdjustment,
  getStockAdjustmentByDoc,
  listStockAdjustments,
  getProductInfo,
  saveStockAdjustment,
  deleteStockAdjustment,
} = require('../services/stockAdjustmentService');

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
    const data = await getLatestStockAdjustment();
    if (!data) {
      return res.status(404).json({ success: false, message: 'No stock adjustments found.' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStockAdjustments = async (req, res) => {
  try {
    const data = await listStockAdjustments(parseInt(req.query.limit, 10) || 50);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStockAdjustment = async (req, res) => {
  try {
    const data = await getStockAdjustmentByDoc(req.params.doc);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Stock adjustment not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLocations = async (req, res) => {
  try {
    res.json({ success: true, data: await fetchLocations() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const data = await getProductInfo(req.params.productId, req.query.locationId);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStockAtLocation = async (req, res) => {
  try {
    const availableStock = await fetchAvailableStock(
      req.params.productId,
      req.query.locationId,
    );
    res.json({ success: true, availableStock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createStockAdjustment = async (req, res) => {
  try {
    const saved = await saveStockAdjustment(req.body, null);
    res.status(201).json({
      success: true,
      message: `Stock adjustment #${saved.doc} saved successfully.`,
      data: saved,
    });
  } catch (error) {
    console.error('POST /api/stock-adjustments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStockAdjustment = async (req, res) => {
  try {
    const saved = await saveStockAdjustment(req.body, req.params.doc);
    res.json({
      success: true,
      message: `Stock adjustment #${saved.doc} updated successfully.`,
      data: saved,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteStockAdjustmentHandler = async (req, res) => {
  try {
    await deleteStockAdjustment(req.params.doc);
    res.json({ success: true, message: `Stock adjustment #${req.params.doc} deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNextNumber,
  getLatest,
  getStockAdjustments,
  getStockAdjustment,
  getLocations,
  getProduct,
  getStockAtLocation,
  createStockAdjustment,
  updateStockAdjustment,
  deleteStockAdjustment: deleteStockAdjustmentHandler,
};
