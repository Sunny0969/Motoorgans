const {
  fetchSalesInvoices,
  fetchSalesInvoiceById,
} = require('../services/tmsModulesService');

const getSalesInvoices = async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = req.query.limit ? Number(req.query.limit) : 500;
    const invoices = await fetchSalesInvoices(search, limit);
    res.json(invoices);
  } catch (error) {
    console.error('GET /api/sales-invoice error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getSalesInvoice = async (req, res) => {
  try {
    const invoice = await fetchSalesInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Sales invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLatestSalesInvoice = async (req, res) => {
  try {
    const invoices = await fetchSalesInvoices('', 1);
    if (!invoices.length) {
      return res.status(404).json({ message: 'No sales invoices found' });
    }
    const detail = await fetchSalesInvoiceById(invoices[0].invoiceId);
    res.json(detail || invoices[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSalesInvoices,
  getSalesInvoice,
  getLatestSalesInvoice,
};
