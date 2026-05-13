const ContactGroup = require('../models/ContactGroup');

// @desc    Get all contact groups
// @route   GET /api/contact-groups
// @access  Public
const getContactGroups = async (req, res) => {
  try {
    const contactGroups = await ContactGroup.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('contacts');
    res.json(contactGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single contact group
// @route   GET /api/contact-groups/:id
// @access  Public
const getContactGroup = async (req, res) => {
  try {
    const contactGroup = await ContactGroup.findById(req.params.id).populate('contacts');
    if (!contactGroup) {
      return res.status(404).json({ message: 'Contact group not found' });
    }
    res.json(contactGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create contact group
// @route   POST /api/contact-groups
// @access  Public
const createContactGroup = async (req, res) => {
  try {
    const { name, description, color, contacts } = req.body;

    const contactGroup = new ContactGroup({
      name,
      description,
      color,
      contacts: contacts || []
    });

    const createdContactGroup = await contactGroup.save();
    const populatedGroup = await ContactGroup.findById(createdContactGroup._id).populate('contacts');
    res.status(201).json(populatedGroup);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Contact group name already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update contact group
// @route   PUT /api/contact-groups/:id
// @access  Public
const updateContactGroup = async (req, res) => {
  try {
    const contactGroup = await ContactGroup.findById(req.params.id);
    if (!contactGroup) {
      return res.status(404).json({ message: 'Contact group not found' });
    }

    const { name, description, color, contacts, isActive } = req.body;

    contactGroup.name = name || contactGroup.name;
    contactGroup.description = description || contactGroup.description;
    contactGroup.color = color || contactGroup.color;
    contactGroup.contacts = contacts !== undefined ? contacts : contactGroup.contacts;
    contactGroup.isActive = isActive !== undefined ? isActive : contactGroup.isActive;

    const updatedContactGroup = await contactGroup.save();
    const populatedGroup = await ContactGroup.findById(updatedContactGroup._id).populate('contacts');
    res.json(populatedGroup);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Contact group name already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete contact group
// @route   DELETE /api/contact-groups/:id
// @access  Public
const deleteContactGroup = async (req, res) => {
  try {
    const contactGroup = await ContactGroup.findById(req.params.id);
    if (!contactGroup) {
      return res.status(404).json({ message: 'Contact group not found' });
    }

    await ContactGroup.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contact group deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search contact groups
// @route   GET /api/contact-groups/search/:query
// @access  Public
const searchContactGroups = async (req, res) => {
  try {
    const query = req.params.query;
    const contactGroups = await ContactGroup.find({
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).populate('contacts').limit(10);
    res.json(contactGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add contact to group
// @route   POST /api/contact-groups/:id/add-contact
// @access  Public
const addContactToGroup = async (req, res) => {
  try {
    const { contactId } = req.body;
    const contactGroup = await ContactGroup.findById(req.params.id);

    if (!contactGroup) {
      return res.status(404).json({ message: 'Contact group not found' });
    }

    if (!contactGroup.contacts.includes(contactId)) {
      contactGroup.contacts.push(contactId);
      await contactGroup.save();
    }

    const populatedGroup = await ContactGroup.findById(contactGroup._id).populate('contacts');
    res.json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove contact from group
// @route   POST /api/contact-groups/:id/remove-contact
// @access  Public
const removeContactFromGroup = async (req, res) => {
  try {
    const { contactId } = req.body;
    const contactGroup = await ContactGroup.findById(req.params.id);

    if (!contactGroup) {
      return res.status(404).json({ message: 'Contact group not found' });
    }

    contactGroup.contacts = contactGroup.contacts.filter(id => id.toString() !== contactId);
    await contactGroup.save();

    const populatedGroup = await ContactGroup.findById(contactGroup._id).populate('contacts');
    res.json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getContactGroups,
  getContactGroup,
  createContactGroup,
  updateContactGroup,
  deleteContactGroup,
  searchContactGroups,
  addContactToGroup,
  removeContactFromGroup
};
