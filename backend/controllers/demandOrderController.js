const {
  getNextDemandOrderNumber,
  getLatestDemandOrder,
  getDemandOrderByDoc,
  listDemandOrders,
  fetchProductStockStatus,
  saveDemandOrder,
  deleteDemandOrder,
  getProductStockInfo,
} = require('../services/demandOrderService');

const getNextNumber = async (req, res) => {
  try {
    const nextNumber = await getNextDemandOrderNumber();
    res.json({ nextNumber, nextDoc: nextNumber });
  } catch (error) {
    console.error('GET /api/demand-orders/next-number error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLatest = async (req, res) => {
  try {
    const order = await getLatestDemandOrder();
    if (!order) {
      return res.status(404).json({ success: false, message: 'No demand orders found.' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('GET /api/demand-orders/latest error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDemandOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const data = await listDemandOrders(limit);
    res.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/demand-orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDemandOrder = async (req, res) => {
  try {
    const order = await getDemandOrderByDoc(req.params.doc);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Demand order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('GET /api/demand-orders/:doc error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStockStatus = async (req, res) => {
  try {
    const data = await fetchProductStockStatus(req.query.search || '');
    res.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/demand-orders/stock-status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductInfo = async (req, res) => {
  try {
    const info = await getProductStockInfo(req.params.productId);
    if (!info) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDemandOrder = async (req, res) => {
  try {
    const doc = req.body.doc ? Number(req.body.doc) : null;
    const saved = await saveDemandOrder(req.body, doc);
    res.status(201).json({
      success: true,
      message: `Demand order #${saved.doc} saved successfully.`,
      data: saved,
    });
  } catch (error) {
    console.error('POST /api/demand-orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDemandOrder = async (req, res) => {
  try {
    const saved = await saveDemandOrder(req.body, req.params.doc);
    res.json({
      success: true,
      message: `Demand order #${saved.doc} updated successfully.`,
      data: saved,
    });
  } catch (error) {
    console.error('PUT /api/demand-orders/:doc error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDemandOrderHandler = async (req, res) => {
  try {
    await deleteDemandOrder(req.params.doc);
    res.json({ success: true, message: `Demand order #${req.params.doc} deleted.` });
  } catch (error) {
    console.error('DELETE /api/demand-orders/:doc error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNextNumber,
  getLatest,
  getDemandOrders,
  getDemandOrder,
  getStockStatus,
  getProductInfo,
  createDemandOrder,
  updateDemandOrder,
  deleteDemandOrder: deleteDemandOrderHandler,
};
