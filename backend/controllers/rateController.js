const Rate = require('../models/Rate');

// Get all rates with optional filters
const getRates = async (req, res) => {
  try {
    const { category, status, dateFrom, dateTo } = req.query;
    let filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.effectiveDate = {};
      if (dateFrom) filter.effectiveDate.$gte = dateFrom;
      if (dateTo) filter.effectiveDate.$lte = dateTo;
    }

    const rates = await Rate.find(filter).sort({ createdAt: -1 });
    res.json(rates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single rate by ID
const getRateById = async (req, res) => {
  try {
    const rate = await Rate.findById(req.params.id);
    if (!rate) {
      return res.status(404).json({ message: 'Rate not found' });
    }
    res.json(rate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new rate
const createRate = async (req, res) => {
  try {
    const { itemCode, itemName, category, uom, costPrice, sellingPrice, minPrice, maxPrice, effectiveDate, status, remarks } = req.body;

    // Validation
    if (!itemName || !category || !costPrice || !sellingPrice) {
      return res.status(400).json({ message: 'Item name, category, cost price, and selling price are required' });
    }

    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);

    if (cost <= 0 || selling <= 0) {
      return res.status(400).json({ message: 'Prices must be greater than zero' });
    }

    if (selling <= cost) {
      return res.status(400).json({ message: 'Selling price must be greater than cost price' });
    }

    // Check if itemCode is unique if provided
    if (itemCode) {
      const existingRate = await Rate.findOne({ itemCode });
      if (existingRate) {
        return res.status(400).json({ message: 'Item code already exists' });
      }
    }

    const rate = new Rate({
      itemCode,
      itemName,
      category,
      uom: uom || 'PC',
      costPrice: cost,
      sellingPrice: selling,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      effectiveDate,
      status: status || 'Active',
      remarks
    });

    const savedRate = await rate.save();
    res.status(201).json(savedRate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update rate
const updateRate = async (req, res) => {
  try {
    const { itemCode, itemName, category, uom, costPrice, sellingPrice, minPrice, maxPrice, effectiveDate, status, remarks } = req.body;

    // Validation
    if (!itemName || !category || !costPrice || !sellingPrice) {
      return res.status(400).json({ message: 'Item name, category, cost price, and selling price are required' });
    }

    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);

    if (cost <= 0 || selling <= 0) {
      return res.status(400).json({ message: 'Prices must be greater than zero' });
    }

    if (selling <= cost) {
      return res.status(400).json({ message: 'Selling price must be greater than cost price' });
    }

    // Check if itemCode is unique if provided and changed
    if (itemCode) {
      const existingRate = await Rate.findOne({ itemCode, _id: { $ne: req.params.id } });
      if (existingRate) {
        return res.status(400).json({ message: 'Item code already exists' });
      }
    }

    const updatedRate = await Rate.findByIdAndUpdate(
      req.params.id,
      {
        itemCode,
        itemName,
        category,
        uom: uom || 'PC',
        costPrice: cost,
        sellingPrice: selling,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        effectiveDate,
        status: status || 'Active',
        remarks
      },
      { new: true }
    );

    if (!updatedRate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    res.json(updatedRate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete rate
const deleteRate = async (req, res) => {
  try {
    const deletedRate = await Rate.findByIdAndDelete(req.params.id);
    if (!deletedRate) {
      return res.status(404).json({ message: 'Rate not found' });
    }
    res.json({ message: 'Rate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRates,
  getRateById,
  createRate,
  updateRate,
  deleteRate
};
