const {
  fetchProducts,
  fetchProductById,
  searchProducts,
} = require('../utils/mssqlRepository');

const getProducts = async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = req.query.limit ? Number(req.query.limit) : 5000;
    const products = await fetchProducts(search, limit);
    res.json(products);
  } catch (error) {
    console.error('GET /api/products error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await fetchProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  res.status(501).json({ message: 'Create product is not implemented for SQL Server yet.' });
};

const updateProduct = async (req, res) => {
  res.status(501).json({ message: 'Update product is not implemented for SQL Server yet.' });
};

const deleteProduct = async (req, res) => {
  res.status(501).json({ message: 'Delete product is not implemented for SQL Server yet.' });
};

const searchProductsHandler = async (req, res) => {
  try {
    const products = await searchProducts(req.params.query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStock = async (req, res) => {
  res.status(501).json({ message: 'Update stock is not implemented for SQL Server yet.' });
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts: searchProductsHandler,
  updateStock,
};
