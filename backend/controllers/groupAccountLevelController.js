const GroupAccountLevel = require('../models/GroupAccountLevel');

// Get all group account levels
const getAllGroupAccountLevels = async (req, res) => {
  try {
    const { parentGroup, level, status, search } = req.query;

    let query = {};

    // Filter by parent group
    if (parentGroup && parentGroup !== 'All') {
      query.parentGroup = parentGroup;
    }

    // Filter by level
    if (level && level !== 'All') {
      query.level = level;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { groupName: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const groupAccountLevels = await GroupAccountLevel.find(query)
      .sort({ parentGroup: 1, level: 1, groupName: 1 });

    res.status(200).json({
      success: true,
      data: groupAccountLevels,
      count: groupAccountLevels.length
    });
  } catch (error) {
    console.error('Error fetching group account levels:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group account levels',
      error: error.message
    });
  }
};

// Get single group account level by ID
const getGroupAccountLevelById = async (req, res) => {
  try {
    const { id } = req.params;

    const groupAccountLevel = await GroupAccountLevel.findById(id);

    if (!groupAccountLevel) {
      return res.status(404).json({
        success: false,
        message: 'Group account level not found'
      });
    }

    res.status(200).json({
      success: true,
      data: groupAccountLevel
    });
  } catch (error) {
    console.error('Error fetching group account level:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group account level',
      error: error.message
    });
  }
};

// Create new group account level
const createGroupAccountLevel = async (req, res) => {
  try {
    const { groupName, code, description, parentGroup, level, status } = req.body;

    // Check if code already exists
    const existingCode = await GroupAccountLevel.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Group code already exists'
      });
    }

    const newGroupAccountLevel = new GroupAccountLevel({
      groupName,
      code: code.toUpperCase(),
      description,
      parentGroup,
      level,
      status: status || 'Active'
    });

    const savedGroupAccountLevel = await newGroupAccountLevel.save();

    res.status(201).json({
      success: true,
      message: 'Group account level created successfully',
      data: savedGroupAccountLevel
    });
  } catch (error) {
    console.error('Error creating group account level:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating group account level',
      error: error.message
    });
  }
};

// Update group account level
const updateGroupAccountLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupName, code, description, parentGroup, level, status } = req.body;

    // Check if code already exists for another record
    const existingCode = await GroupAccountLevel.findOne({
      code: code.toUpperCase(),
      _id: { $ne: id }
    });

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Group code already exists'
      });
    }

    const updatedGroupAccountLevel = await GroupAccountLevel.findByIdAndUpdate(
      id,
      {
        groupName,
        code: code.toUpperCase(),
        description,
        parentGroup,
        level,
        status
      },
      { new: true, runValidators: true }
    );

    if (!updatedGroupAccountLevel) {
      return res.status(404).json({
        success: false,
        message: 'Group account level not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Group account level updated successfully',
      data: updatedGroupAccountLevel
    });
  } catch (error) {
    console.error('Error updating group account level:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating group account level',
      error: error.message
    });
  }
};

// Delete group account level
const deleteGroupAccountLevel = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedGroupAccountLevel = await GroupAccountLevel.findByIdAndDelete(id);

    if (!deletedGroupAccountLevel) {
      return res.status(404).json({
        success: false,
        message: 'Group account level not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Group account level deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group account level:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting group account level',
      error: error.message
    });
  }
};

// Get distinct parent groups
const getParentGroups = async (req, res) => {
  try {
    const parentGroups = await GroupAccountLevel.distinct('parentGroup');
    res.status(200).json({
      success: true,
      data: parentGroups
    });
  } catch (error) {
    console.error('Error fetching parent groups:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching parent groups',
      error: error.message
    });
  }
};

// Get distinct levels
const getLevels = async (req, res) => {
  try {
    const levels = await GroupAccountLevel.distinct('level');
    res.status(200).json({
      success: true,
      data: levels.sort()
    });
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching levels',
      error: error.message
    });
  }
};

module.exports = {
  getAllGroupAccountLevels,
  getGroupAccountLevelById,
  createGroupAccountLevel,
  updateGroupAccountLevel,
  deleteGroupAccountLevel,
  getParentGroups,
  getLevels
};
