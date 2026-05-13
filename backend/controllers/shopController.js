const Shop = require('../models/Shop');

// @desc    Get all shops
// @route   GET /api/shops
// @access  Public
const getShops = async (req, res) => {
  try {
    const shops = await Shop.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single shop
// @route   GET /api/shops/:id
// @access  Public
const getShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create shop
// @route   POST /api/shops
// @access  Public
const createShop = async (req, res) => {
  try {
    const { code, name, type, address, contact, email, manager, status, openingDate } = req.body;

    const shop = new Shop({
      code,
      name,
      type,
      address,
      contact,
      email,
      manager,
      status,
      openingDate
    });

    const createdShop = await shop.save();
    res.status(201).json(createdShop);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Shop code already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update shop
// @route   PUT /api/shops/:id
// @access  Public
const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const { code, name, type, address, contact, email, manager, status, openingDate, isActive } = req.body;

    shop.code = code || shop.code;
    shop.name = name || shop.name;
    shop.type = type || shop.type;
    shop.address = address || shop.address;
    shop.contact = contact || shop.contact;
    shop.email = email || shop.email;
    shop.manager = manager || shop.manager;
    shop.status = status || shop.status;
    shop.openingDate = openingDate || shop.openingDate;
    shop.isActive = isActive !== undefined ? isActive : shop.isActive;

    const updatedShop = await shop.save();
    res.json(updatedShop);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Shop code already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete shop
// @route   DELETE /api/shops/:id
// @access  Public
const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    await Shop.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shop deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search shops
// @route   GET /api/shops/search/:query
// @access  Public
const searchShops = async (req, res) => {
  try {
    const query = req.params.query;
    const shops = await Shop.find({
      isActive: true,
      $or: [
        { code: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
        { manager: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getShops,
  getShop,
  createShop,
  updateShop,
  deleteShop,
  searchShops
};
