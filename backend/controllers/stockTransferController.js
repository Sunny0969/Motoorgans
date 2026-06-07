const {
  fetchLocations,
  fetchAvailableStock,
  getNextInvoiceNumber,
  getLatestStockTransfer,
  getStockTransferByDoc,
  listStockTransfers,
  getProductInfo,
  saveStockTransfer,
  deleteStockTransfer,
} = require('../services/stockTransferService');

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
    const data = await getLatestStockTransfer();
    if (!data) {
      return res.status(404).json({ success: false, message: 'No stock transfers found.' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStockTransfers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const data = await listStockTransfers(limit);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStockTransfer = async (req, res) => {
  try {
    const data = await getStockTransferByDoc(req.params.doc);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Stock transfer not found' });
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
    const fromLocationId = req.query.fromLocationId;
    const data = await getProductInfo(req.params.productId, fromLocationId);
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
    const qty = await fetchAvailableStock(
      req.params.productId,
      req.query.locationId,
    );
    res.json({ success: true, availableStock: qty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createStockTransfer = async (req, res) => {
  try {
    const saved = await saveStockTransfer(req.body, null);
    res.status(201).json({
      success: true,
      message: `Stock transfer #${saved.doc} saved successfully.`,
      data: saved,
    });
  } catch (error) {
    console.error('POST /api/stock-transfers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStockTransfer = async (req, res) => {
  try {
    const saved = await saveStockTransfer(req.body, req.params.doc);
    res.json({
      success: true,
      message: `Stock transfer #${saved.doc} updated successfully.`,
      data: saved,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteStockTransferHandler = async (req, res) => {
  try {
    await deleteStockTransfer(req.params.doc);
    res.json({ success: true, message: `Stock transfer #${req.params.doc} deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNextNumber,
  getLatest,
  getStockTransfers,
  getStockTransfer,
  getLocations,
  getProduct,
  getStockAtLocation,
  createStockTransfer,
  updateStockTransfer,
  deleteStockTransfer: deleteStockTransferHandler,
};
