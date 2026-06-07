const {
  fetchSuppliers,
  getNextDocNumber,
  getLatestPurchaseOrder,
  getPurchaseOrderByDoc,
  listPurchaseOrders,
  getProductInfo,
  savePurchaseOrder,
  deletePurchaseOrder,
} = require('../services/purchaseOrderService');

const getNextNumber = async (req, res) => {
  try {
    const nextNumber = await getNextDocNumber();
    res.json({ nextNumber, poNumber: nextNumber, invoiceNo: nextNumber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLatest = async (req, res) => {
  try {
    const data = await getLatestPurchaseOrder();
    if (!data) {
      return res.status(404).json({ success: false, message: 'No purchase orders found.' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPurchaseOrders = async (req, res) => {
  try {
    const data = await listPurchaseOrders(parseInt(req.query.limit, 10) || 50);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPurchaseOrder = async (req, res) => {
  try {
    const data = await getPurchaseOrderByDoc(req.params.doc);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSuppliersList = async (req, res) => {
  try {
    const data = await fetchSuppliers();
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

const createPurchaseOrder = async (req, res) => {
  try {
    const saved = await savePurchaseOrder(req.body, null);
    res.status(201).json({
      success: true,
      message: `Purchase order #${saved.doc} saved successfully.`,
      data: saved,
    });
  } catch (error) {
    console.error('POST /api/purchase-orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const saved = await savePurchaseOrder(req.body, req.params.doc);
    res.json({
      success: true,
      message: `Purchase order #${saved.doc} updated successfully.`,
      data: saved,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePurchaseOrderHandler = async (req, res) => {
  try {
    await deletePurchaseOrder(req.params.doc);
    res.json({ success: true, message: `Purchase order #${req.params.doc} deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNextNumber,
  getLatest,
  getPurchaseOrders,
  getPurchaseOrder,
  getSuppliersList,
  getProduct,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder: deletePurchaseOrderHandler,
};
