import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ContactGroups = () => {
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3498db'
  });

  // Fetch contact groups on component mount
  useEffect(() => {
    fetchContactGroups();
  }, []);

  const fetchContactGroups = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/contact-groups');
      setGroups(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch contact groups');
      console.error('Error fetching contact groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Main container style
  const containerStyle = {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    minHeight: '100vh',
    backgroundColor: '#f8f9fa'
  };

  // Top Header Component
  const Header = () => {
    const headerStyle = {
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '16px 24px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    };

    const leftSectionStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    };

    const logoStyle = {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#3498db'
    };

    const titleStyle = {
      fontSize: '20px',
      fontWeight: '600'
    };

    const rightSectionStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    };

    const iconButtonStyle = {
      background: 'none',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '4px',
      transition: 'background-color 0.3s'
    };

    const userInfoStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    };

    const avatarStyle = {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: '#3498db',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold'
    };

    return (
      <header style={headerStyle}>
        <div style={leftSectionStyle}>
          <div style={logoStyle}>POS</div>
          <div style={titleStyle}>Contact Groups</div>
        </div>

        <div style={rightSectionStyle}>
          <button style={iconButtonStyle} title="Notifications">
            🔔
          </button>
          <button style={iconButtonStyle} title="Settings">
            ⚙️
          </button>
          <div style={userInfoStyle}>
            <div style={avatarStyle}>JD</div>
            <span>John Doe</span>
          </div>
        </div>
      </header>
    );
  };

  // Content area style
  const contentStyle = {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  // Card style for sections
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0'
  };

  // Header actions style
  const headerActionsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  };

  // Search and filter style
  const searchContainerStyle = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  };

  const searchInputStyle = {
    padding: '10px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
    width: '300px',
    maxWidth: '100%',
    transition: 'all 0.3s ease'
  };

  const searchInputFocusStyle = {
    ...searchInputStyle,
    borderColor: '#3498db',
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.1)'
  };

  // Button styles
  const buttonBaseStyle = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  };

  const primaryButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#3498db',
    color: 'white'
  };

  const primaryButtonHoverStyle = {
    ...primaryButtonStyle,
    backgroundColor: '#2980b9',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)'
  };

  const successButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#27ae60',
    color: 'white'
  };

  const successButtonHoverStyle = {
    ...successButtonStyle,
    backgroundColor: '#219a52',
    transform: 'translateY(-1px)'
  };

  const secondaryButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#95a5a6',
    color: 'white'
  };

  const secondaryButtonHoverStyle = {
    ...secondaryButtonStyle,
    backgroundColor: '#7f8c8d'
  };

  const dangerButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#e74c3c',
    color: 'white'
  };

  const dangerButtonHoverStyle = {
    ...dangerButtonStyle,
    backgroundColor: '#c0392b'
  };

  // Groups grid style
  const groupsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '24px'
  };

  const groupCardStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: 'white',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative'
  };

  const groupCardHoverStyle = {
    ...groupCardStyle,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  };

  const groupHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  };

  const groupNameStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2c3e50',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const groupColorStyle = {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block'
  };

  const groupDescriptionStyle = {
    color: '#7f8c8d',
    fontSize: '14px',
    marginBottom: '16px',
    lineHeight: '1.4'
  };

  const groupStatsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#95a5a6'
  };

  const groupActionsStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '16px'
  };

  const smallButtonStyle = {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  // Form styles
  const formStyle = {
    marginTop: '24px'
  };

  const formGroupStyle = {
    marginBottom: '20px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#2c3e50',
    fontSize: '14px'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box'
  };

  const inputFocusStyle = {
    ...inputStyle,
    borderColor: '#3498db',
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.1)'
  };

  const colorInputStyle = {
    width: '60px',
    height: '40px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  };

  // State for hover and focus
  const [hoverStates, setHoverStates] = useState({
    createButton: false,
    searchInput: false,
    groupCards: {}
  });

  const [focusedField, setFocusedField] = useState(null);

  // Filter groups based on search
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handler functions
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateGroup = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3498db'
    });
    setEditingGroup(null);
    setShowForm(true);
  };

  const handleEditGroup = (group) => {
    setFormData({
      name: group.name,
      description: group.description,
      color: group.color
    });
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Group name is required');
      return;
    }

    try {
      setIsLoading(true);
      if (editingGroup) {
        // Update existing group
        const response = await api.put(`/contact-groups/${editingGroup._id}`, formData);
        setGroups(groups.map(group =>
          group._id === editingGroup._id ? response.data : group
        ));
      } else {
        // Create new group
        const response = await api.post('/contact-groups', formData);
        setGroups([...groups, response.data]);
      }

      setShowForm(false);
      setFormData({ name: '', description: '', color: '#3498db' });
      setEditingGroup(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save contact group');
      console.error('Error saving contact group:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await api.delete(`/contact-groups/${groupId}`);
        setGroups(groups.filter(group => group._id !== groupId));
        setError(null);
      } catch (err) {
        setError('Failed to delete contact group');
        console.error('Error deleting contact group:', err);
      }
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setFormData({ name: '', description: '', color: '#3498db' });
    setEditingGroup(null);
  };

  const getButtonStyle = (type, isHovered) => {
    const styles = {
      primary: isHovered ? primaryButtonHoverStyle : primaryButtonStyle,
      success: isHovered ? successButtonHoverStyle : successButtonStyle,
      secondary: isHovered ? secondaryButtonHoverStyle : secondaryButtonStyle,
      danger: isHovered ? dangerButtonHoverStyle : dangerButtonStyle
    };
    return styles[type] || primaryButtonStyle;
  };

  const getInputStyle = (field) => {
    return focusedField === field ? inputFocusStyle : inputStyle;
  };

  return (
    <div style={containerStyle}>
      <Header />

      <div style={contentStyle}>
        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '24px',
            border: '1px solid #fcc'
          }}>
            {error}
          </div>
        )}

        {/* Header Actions */}
        <div style={cardStyle}>
          <div style={headerActionsStyle}>
            <div style={searchContainerStyle}>
              <input
                type="text"
                placeholder="Search groups..."
                style={hoverStates.searchInput ? searchInputFocusStyle : searchInputStyle}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setHoverStates(prev => ({ ...prev, searchInput: true }))}
                onBlur={() => setHoverStates(prev => ({ ...prev, searchInput: false }))}
              />
              <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
                {filteredGroups.length} groups found
              </div>
            </div>

            <button
              style={getButtonStyle('primary', hoverStates.createButton)}
              onClick={handleCreateGroup}
              onMouseEnter={() => setHoverStates(prev => ({ ...prev, createButton: true }))}
              onMouseLeave={() => setHoverStates(prev => ({ ...prev, createButton: false }))}
            >
              ➕ Create New Group
            </button>
          </div>

          {/* Create/Edit Form */}
          {showForm && (
            <div style={formStyle}>
              <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </h3>

              <form onSubmit={handleSaveGroup}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    Group Name <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={getInputStyle('name')}
                    placeholder="Enter group name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    style={{
                      ...getInputStyle('description'),
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    placeholder="Enter group description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    onFocus={() => setFocusedField('description')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Group Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="color"
                      style={colorInputStyle}
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                    />
                    <span style={{ color: '#7f8c8d', fontSize: '14px' }}>
                      {formData.color}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="submit"
                    style={getButtonStyle('success', false)}
                    disabled={isLoading || !formData.name.trim()}
                  >
                    {isLoading ? 'Saving...' : (editingGroup ? 'Update Group' : 'Create Group')}
                  </button>
                  <button
                    type="button"
                    style={getButtonStyle('secondary', false)}
                    onClick={cancelForm}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Groups Grid */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
            Contact Groups ({filteredGroups.length})
          </h3>

          {isLoading && groups.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#7f8c8d'
            }}>
              Loading contact groups...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#7f8c8d'
            }}>
              No groups found. Create your first group to get started.
            </div>
          ) : (
            <div style={groupsGridStyle}>
              {filteredGroups.map((group) => (
                <div
                  key={group._id}
                  style={
                    hoverStates.groupCards[group._id]
                      ? groupCardHoverStyle
                      : groupCardStyle
                  }
                  onMouseEnter={() => setHoverStates(prev => ({
                    ...prev,
                    groupCards: { ...prev.groupCards, [group._id]: true }
                  }))}
                  onMouseLeave={() => setHoverStates(prev => ({
                    ...prev,
                    groupCards: { ...prev.groupCards, [group._id]: false }
                  }))}
                >
                  <div style={groupHeaderStyle}>
                    <div style={groupNameStyle}>
                      <span
                        style={{
                          ...groupColorStyle,
                          backgroundColor: group.color
                        }}
                      ></span>
                      {group.name}
                    </div>
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#2c3e50'
                    }}>
                      {group.contactCount || 0} contacts
                    </div>
                  </div>

                  <div style={groupDescriptionStyle}>
                    {group.description}
                  </div>

                  <div style={groupStatsStyle}>
                    <span>Created: {new Date(group.createdAt).toLocaleDateString()}</span>
                    <span>ID: #{group._id.slice(-6)}</span>
                  </div>

                  <div style={groupActionsStyle}>
                    <button
                      style={{
                        ...smallButtonStyle,
                        backgroundColor: '#3498db',
                        color: 'white'
                      }}
                      onClick={() => handleEditGroup(group)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      style={{
                        ...smallButtonStyle,
                        backgroundColor: '#e74c3c',
                        color: 'white'
                      }}
                      onClick={() => handleDeleteGroup(group._id)}
                    >
                      🗑️ Delete
                    </button>
                    <button
                      style={{
                        ...smallButtonStyle,
                        backgroundColor: '#2ecc71',
                        color: 'white'
                      }}
                    >
                      👥 View Contacts
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactGroups;
