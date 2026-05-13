const FinancialStatementLevel = require('../models/FinancialStatementLevel');

// Get all financial statement levels
const getAllLevels = async (req, res) => {
  try {
    const levels = await FinancialStatementLevel.find().sort({ createdAt: 1 });
    res.status(200).json({
      success: true,
      data: levels
    });
  } catch (error) {
    console.error('Error fetching financial statement levels:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching financial statement levels',
      error: error.message
    });
  }
};

// Get a single level by ID
const getLevelById = async (req, res) => {
  try {
    const level = await FinancialStatementLevel.findById(req.params.id);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Financial statement level not found'
      });
    }
    res.status(200).json({
      success: true,
      data: level
    });
  } catch (error) {
    console.error('Error fetching financial statement level:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching financial statement level',
      error: error.message
    });
  }
};

// Create a new level
const createLevel = async (req, res) => {
  try {
    const { levelName, code, description, status } = req.body;

    // Check if code already exists
    const existingLevel = await FinancialStatementLevel.findOne({ code });
    if (existingLevel) {
      return res.status(400).json({
        success: false,
        message: 'Level code already exists'
      });
    }

    const newLevel = new FinancialStatementLevel({
      levelName,
      code,
      description,
      status
    });

    const savedLevel = await newLevel.save();
    res.status(201).json({
      success: true,
      message: 'Financial statement level created successfully',
      data: savedLevel
    });
  } catch (error) {
    console.error('Error creating financial statement level:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating financial statement level',
      error: error.message
    });
  }
};

// Update a level
const updateLevel = async (req, res) => {
  try {
    const { levelName, code, description, status } = req.body;

    // Check if code already exists for another level
    const existingLevel = await FinancialStatementLevel.findOne({
      code,
      _id: { $ne: req.params.id }
    });
    if (existingLevel) {
      return res.status(400).json({
        success: false,
        message: 'Level code already exists'
      });
    }

    const updatedLevel = await FinancialStatementLevel.findByIdAndUpdate(
      req.params.id,
      { levelName, code, description, status },
      { new: true, runValidators: true }
    );

    if (!updatedLevel) {
      return res.status(404).json({
        success: false,
        message: 'Financial statement level not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Financial statement level updated successfully',
      data: updatedLevel
    });
  } catch (error) {
    console.error('Error updating financial statement level:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating financial statement level',
      error: error.message
    });
  }
};

// Delete a level
const deleteLevel = async (req, res) => {
  try {
    const deletedLevel = await FinancialStatementLevel.findByIdAndDelete(req.params.id);

    if (!deletedLevel) {
      return res.status(404).json({
        success: false,
        message: 'Financial statement level not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Financial statement level deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting financial statement level:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting financial statement level',
      error: error.message
    });
  }
};

module.exports = {
  getAllLevels,
  getLevelById,
  createLevel,
  updateLevel,
  deleteLevel
};
