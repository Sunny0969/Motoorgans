const express = require('express');
const router = express.Router();
const {
  getContactGroups,
  getContactGroup,
  createContactGroup,
  updateContactGroup,
  deleteContactGroup,
  searchContactGroups,
  addContactToGroup,
  removeContactFromGroup
} = require('../controllers/contactGroupController');

// Routes for contact groups
router.route('/')
  .get(getContactGroups)
  .post(createContactGroup);

router.route('/:id')
  .get(getContactGroup)
  .put(updateContactGroup)
  .delete(deleteContactGroup);

router.route('/search/:query')
  .get(searchContactGroups);

router.route('/:id/add-contact')
  .post(addContactToGroup);

router.route('/:id/remove-contact')
  .post(removeContactFromGroup);

module.exports = router;
