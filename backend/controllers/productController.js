const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Public
const createProduct = async (req, res) => {
  try {
    const { code, name, description, category, uom, price, cost, stock, minStock, location } = req.body;

    const product = new Product({
      code,
      name,
      description,
      category,
      uom,
      price,
      cost,
      stock,
      minStock,
      location
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Product code already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Public
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { code, name, description, category, uom, price, cost, stock, minStock, location, isActive } = req.body;

    product.code = code || product.code;
    product.name = name || product.name;
    product.description = description || product.description;
    product.category = category || product.category;
    product.uom = uom || product.uom;
    product.price = price !== undefined ? price : product.price;
    product.cost = cost !== undefined ? cost : product.cost;
    product.stock = stock !== undefined ? stock : product.stock;
    product.minStock = minStock !== undefined ? minStock : product.minStock;
    product.location = location || product.location;
    product.isActive = isActive !== undefined ? isActive : product.isActive;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Product code already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Public
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = false;
    await product.save();
    res.json({ message: 'Product deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search products
// @route   GET /api/products/search/:query
// @access  Public
const searchProducts = async (req, res) => {
  try {
    const query = req.params.query;
    const products = await Product.find({
      isActive: true,
      $or: [
        { code: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Public
const updateStock = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { stock } = req.body;
    product.stock = stock !== undefined ? stock : product.stock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  updateStock
};
