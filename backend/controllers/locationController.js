const Location = require('../models/Location');

// Get all locations
const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get location by ID
const getLocationById = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new location
const createLocation = async (req, res) => {
  try {
    const { locationName, code, address, contactPerson, phone, email, status } = req.body;

    // Check if code already exists
    const existingLocation = await Location.findOne({ code: code.toUpperCase() });
    if (existingLocation) {
      return res.status(400).json({ message: 'Location code already exists' });
    }

    const location = new Location({
      locationName,
      code: code.toUpperCase(),
      address,
      contactPerson,
      phone,
      email,
      status
    });

    const savedLocation = await location.save();
    res.status(201).json(savedLocation);
  } catch (error) {
    console.error('Error creating location:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update location
const updateLocation = async (req, res) => {
  try {
    const { locationName, code, address, contactPerson, phone, email, status } = req.body;

    // Check if code already exists (excluding current location)
    const existingLocation = await Location.findOne({
      code: code.toUpperCase(),
      _id: { $ne: req.params.id }
    });
    if (existingLocation) {
      return res.status(400).json({ message: 'Location code already exists' });
    }

    const location = await Location.findByIdAndUpdate(
      req.params.id,
      {
        locationName,
        code: code.toUpperCase(),
        address,
        contactPerson,
        phone,
        email,
        status
      },
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete location
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
};
