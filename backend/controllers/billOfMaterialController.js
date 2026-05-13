const BillOfMaterial = require('../models/BillOfMaterial');

// Get all BOM items
const getAllBOM = async (req, res) => {
  try {
    const bomItems = await BillOfMaterial.find().sort({ createdAt: -1 });
    res.status(200).json(bomItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get BOM item by ID
const getBOMById = async (req, res) => {
  try {
    const bomItem = await BillOfMaterial.findById(req.params.id);
    if (!bomItem) {
      return res.status(404).json({ message: 'BOM item not found' });
    }
    res.status(200).json(bomItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new BOM item
const createBOM = async (req, res) => {
  try {
    const { productName, productCode, description, category, sellingPrice, components, status } = req.body;

    // Calculate total cost from components
    const totalCost = components.reduce((sum, component) => {
      return sum + (component.quantity * component.cost);
    }, 0);

    const newBOM = new BillOfMaterial({
      productName,
      productCode,
      description,
      category,
      cost: totalCost,
      sellingPrice,
      components,
      status
    });

    const savedBOM = await newBOM.save();
    res.status(201).json(savedBOM);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Product code already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

// Update BOM item
const updateBOM = async (req, res) => {
  try {
    const { productName, productCode, description, category, sellingPrice, components, status } = req.body;

    // Calculate total cost from components
    const totalCost = components.reduce((sum, component) => {
      return sum + (component.quantity * component.cost);
    }, 0);

    const updatedBOM = await BillOfMaterial.findByIdAndUpdate(
      req.params.id,
      {
        productName,
        productCode,
        description,
        category,
        cost: totalCost,
        sellingPrice,
        components,
        status
      },
      { new: true, runValidators: true }
    );

    if (!updatedBOM) {
      return res.status(404).json({ message: 'BOM item not found' });
    }

    res.status(200).json(updatedBOM);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Product code already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

// Delete BOM item
const deleteBOM = async (req, res) => {
  try {
    const deletedBOM = await BillOfMaterial.findByIdAndDelete(req.params.id);
    if (!deletedBOM) {
      return res.status(404).json({ message: 'BOM item not found' });
    }
    res.status(200).json({ message: 'BOM item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get BOM items by category
const getBOMByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const bomItems = await BillOfMaterial.find({ category }).sort({ createdAt: -1 });
    res.status(200).json(bomItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search BOM items
const searchBOM = async (req, res) => {
  try {
    const { query } = req.query;
    const bomItems = await BillOfMaterial.find({
      $or: [
        { productName: { $regex: query, $options: 'i' } },
        { productCode: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json(bomItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllBOM,
  getBOMById,
  createBOM,
  updateBOM,
  deleteBOM,
  getBOMByCategory,
  searchBOM
};
