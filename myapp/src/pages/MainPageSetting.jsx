import React, { useState } from 'react';

const MainPageSetting = () => {
  const [settings, setSettings] = useState({
    // General Settings
    businessName: 'My POS Business',
    businessLogo: '',
    themeColor: '#007bff',
    language: 'en',
    currency: 'USD',
    timezone: 'UTC-5',
    
    // Display Settings
    showImages: true,
    showPrices: true,
    showStock: true,
    quickButtons: true,
    recentProducts: true,
    
    // Receipt Settings
    receiptHeader: 'Thank you for your business!',
    receiptFooter: 'Returns within 7 days with receipt',
    printAutomatically: false,
    printCustomerCopy: true,
    printKitchenCopy: false,
    
    // Security Settings
    autoLogout: 30,
    requirePassword: true,
    adminApproval: false,
    auditLog: true,
    
    // Notification Settings
    lowStockAlert: true,
    salesNotifications: true,
    soundEnabled: true,
    emailReports: false
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
    // Save logic would go here
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        businessName: 'My POS Business',
        businessLogo: '',
        themeColor: '#007bff',
        language: 'en',
        currency: 'USD',
        timezone: 'UTC-5',
        showImages: true,
        showPrices: true,
        showStock: true,
        quickButtons: true,
        recentProducts: true,
        receiptHeader: 'Thank you for your business!',
        receiptFooter: 'Returns within 7 days with receipt',
        printAutomatically: false,
        printCustomerCopy: true,
        printKitchenCopy: false,
        autoLogout: 30,
        requirePassword: true,
        adminApproval: false,
        auditLog: true,
        lowStockAlert: true,
        salesNotifications: true,
        soundEnabled: true,
        emailReports: false
      });
    }
  };

  const handlePreview = () => {
    alert('Opening preview mode...');
  };

  const tabs = [
    { id: 'general', label: 'General Settings', icon: '⚙️' },
    { id: 'display', label: 'Display', icon: '🖥️' },
    { id: 'receipt', label: 'Receipt', icon: '🧾' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Main Page Settings</h1>
        <p style={subtitleStyle}>Configure your POS system appearance and behavior</p>
      </div>

      {/* Main Content */}
      <div style={contentStyle}>
        {/* Tabs Navigation */}
        <div style={tabsContainerStyle}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              style={{
                ...tabStyle,
                ...(activeTab === tab.id ? activeTabStyle : {})
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={tabIconStyle}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div style={settingsContainerStyle}>
          {/* General Settings */}
          {activeTab === 'general' && (
            <div style={tabContentStyle}>
              <h3 style={sectionTitleStyle}>General Settings</h3>
              
              <div style={settingsGridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={settings.businessName}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Enter business name"
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Theme Color</label>
                  <div style={colorInputContainerStyle}>
                    <input
                      type="color"
                      name="themeColor"
                      value={settings.themeColor}
                      onChange={handleInputChange}
                      style={colorInputStyle}
                    />
                    <span style={colorValueStyle}>{settings.themeColor}</span>
                  </div>
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Language</label>
                  <select
                    name="language"
                    value={settings.language}
                    onChange={handleInputChange}
                    style={inputStyle}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Currency</label>
                  <select
                    name="currency"
                    value={settings.currency}
                    onChange={handleInputChange}
                    style={inputStyle}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Timezone</label>
                  <select
                    name="timezone"
                    value={settings.timezone}
                    onChange={handleInputChange}
                    style={inputStyle}
                  >
                    <option value="UTC-5">EST (UTC-5)</option>
                    <option value="UTC-6">CST (UTC-6)</option>
                    <option value="UTC-7">MST (UTC-7)</option>
                    <option value="UTC-8">PST (UTC-8)</option>
                  </select>
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Business Logo</label>
                  <div style={fileUploadStyle}>
                    <button style={browseButtonStyle}>Browse</button>
                    <span style={fileNameStyle}>No file chosen</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Display Settings */}
          {activeTab === 'display' && (
            <div style={tabContentStyle}>
              <h3 style={sectionTitleStyle}>Display Settings</h3>
              
              <div style={toggleGridStyle}>
                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      name="showImages"
                      checked={settings.showImages}
                      onChange={handleInputChange}
                      style={checkboxStyle}
                    />
                    Show Product Images
                  </label>
                  <span style={toggleDescriptionStyle}>Display product images in catalog</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      name="showPrices"
                      checked={settings.showPrices}
                      onChange={handleInputChange}
                      style={checkboxStyle}
                    />
                    Show Prices
                  </label>
                  <span style={toggleDescriptionStyle}>Display prices on product cards</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      name="showStock"
                      checked={settings.showStock}
                      onChange={handleInputChange}
                      style={checkboxStyle}
                    />
                    Show Stock Levels
                  </label>
                  <span style={toggleDescriptionStyle}>Display current stock quantities</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      name="quickButtons"
                      checked={settings.quickButtons}
                      onChange={handleInputChange}
                      style={checkboxStyle}
                    />
                    Quick Action Buttons
                  </label>
                  <span style={toggleDescriptionStyle}>Show quick action buttons on main screen</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      name="recentProducts"
                      checked={settings.recentProducts}
                      onChange={handleInputChange}
                      style={checkboxStyle}
                    />
                    Recent Products
                  </label>
                  <span style={toggleDescriptionStyle}>Show recently used products</span>
                </div>
              </div>
            </div>
          )}

          {/* Receipt Settings */}
          {activeTab === 'receipt' && (
            <div style={tabContentStyle}>
              <h3 style={sectionTitleStyle}>Receipt Settings</h3>
              
              <div style={settingsGridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Receipt Header</label>
                  <textarea
                    name="receiptHeader"
                    value={settings.receiptHeader}
                    onChange={handleInputChange}
                    style={textareaStyle}
                    placeholder="Enter receipt header text"
                    rows="3"
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Receipt Footer</label>
                  <textarea
                    name="receiptFooter"
                    value={settings.receiptFooter}
                    onChange={handleInputChange}
                    style={textareaStyle}
                    placeholder="Enter receipt footer text"
                    rows="3"
                  />
                </div>

                <div style={toggleGridStyle}>
                  <div style={toggleItemStyle}>
                    <label style={toggleLabelStyle}>
                      <input
                        type="checkbox"
                        name="printAutomatically"
                        checked={settings.printAutomatically}
                        onChange={handleInputChange}
                        style={checkboxStyle}
                      />
                      Print Automatically
                    </label>
                    <span style={toggleDescriptionStyle}>Auto-print receipt after sale</span>
                  </div>

                  <div style={toggleItemStyle}>
                    <label style={toggleLabelStyle}>
                      <input
                        type="checkbox"
                        name="printCustomerCopy"
                        checked={settings.printCustomerCopy}
                        onChange={handleInputChange}
                        style={checkboxStyle}
                      />
                      Print Customer Copy
                    </label>
                    <span style={toggleDescriptionStyle}>Print receipt for customer</span>
                  </div>

                  <div style={toggleItemStyle}>
                    <label style={toggleLabelStyle}>
                      <input
                        type="checkbox"
                        name="printKitchenCopy"
                        checked={settings.printKitchenCopy}
                        onChange={handleInputChange}
                        style={checkboxStyle}
                      />
                      Print Kitchen Copy
                    </label>
                    <span style={toggleDescriptionStyle}>Print order for kitchen</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div style={tabContentStyle}>
              <h3 style={sectionTitleStyle}>Security Settings</h3>
              
              <div style={settingsGridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Auto Logout (minutes)</label>
                  <input
                    type="number"
                    name="autoLogout"
                    value={settings.autoLogout}
                    onChange={handleInputChange}
                    style={inputStyle}
                    min="1"
                    max="120"
                  />
                </div>

                <div style={toggleGridStyle}>
                  <div style={toggleItemStyle}>
                    <label style={toggleLabelStyle}>
                      <input
                        type="checkbox"
                        name="requirePassword"
                        checked={settings.requirePassword}
                        onChange={handleInputChange}
                        style={checkboxStyle}
                      />
                      Require Password for Refunds
                    </label>
                    <span style={toggleDescriptionStyle}>Password required for refund transactions</span>
                  </div>

                  <div style={toggleItemStyle}>
                    <label style={toggleLabelStyle}>
                      <input
                        type="checkbox"
                        name="adminApproval"
                        checked={settings.adminApproval}
                        onChange={handleInputChange}
                        style={checkboxStyle}
                      />
                      Admin Approval for Discounts
                    </label>
                    <span style={toggleDescriptionStyle}>Large discounts require admin approval</span>
                  </div>

                  <div style={toggleItemStyle}>
                    <label style={toggleLabelStyle}>
                      <input
                        type="checkbox"
                        name="auditLog"
                        checked={settings.auditLog}
                        onChange={handleInputChange}
                        style={checkboxStyle}
                      />
                      Enable Audit Log
                    </label>
                    <span style={toggleDescriptionStyle}>Log all system activities</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div style={tabContentStyle}>
              <h3 style={sectionTitleStyle}>Notification Settings</h3>
              
              <div style={toggleGridStyle}>
                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      name="lowStockAlert"
                      checked={settings.lowStockAlert}
                      onChange={handleInputChange}
                      style={checkboxStyle}
                    />
                    Low Stock Alerts
                  </label>
                  <span style={toggleDescriptionStyle}>Get notified when products are low in stock</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      name="salesNotifications"
                      checked={settings.salesNotifications}
                      onChange={handleInputChange}
                      style={checkboxStyle}
                    />
                    Sales Notifications
                  </label>
                  <span style={toggleDescriptionStyle}>Show real-time sales notifications</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      name="soundEnabled"
                      checked={settings.soundEnabled}
                      onChange={handleInputChange}
                      style={checkboxStyle}
                    />
                    Enable Sounds
                  </label>
                  <span style={toggleDescriptionStyle}>Play sounds for notifications</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      name="emailReports"
                      checked={settings.emailReports}
                      onChange={handleInputChange}
                      style={checkboxStyle}
                    />
                    Email Daily Reports
                  </label>
                  <span style={toggleDescriptionStyle}>Send daily sales reports via email</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={actionButtonGroupStyle}>
        <button 
          style={{...actionButtonStyle, ...secondaryButtonStyle}}
          onClick={handleReset}
        >
          Reset to Default
        </button>
        <button 
          style={{...actionButtonStyle, ...infoButtonStyle}}
          onClick={handlePreview}
        >
          Preview
        </button>
        <button 
          style={{...actionButtonStyle, ...successButtonStyle}}
          onClick={handleSave}
        >
          Save Settings
        </button>
        <button 
          style={{...actionButtonStyle, ...closeButtonStyle}}
          onClick={() => window.close()}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Inline Styles
const containerStyle = {
  fontFamily: 'Arial, sans-serif',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px',
  backgroundColor: '#f5f5f5',
  minHeight: '100vh'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '20px',
  padding: '20px',
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const titleStyle = {
  color: '#333',
  margin: '0 0 10px 0',
  fontSize: '28px',
  fontWeight: 'bold'
};

const subtitleStyle = {
  color: '#666',
  margin: '0',
  fontSize: '16px'
};

const contentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  marginBottom: '20px'
};

const tabsContainerStyle = {
  display: 'flex',
  gap: '5px',
  backgroundColor: '#fff',
  padding: '10px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  flexWrap: 'wrap'
};

const tabStyle = {
  padding: '12px 20px',
  border: 'none',
  backgroundColor: 'transparent',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.3s ease'
};

const activeTabStyle = {
  backgroundColor: '#007bff',
  color: 'white'
};

const tabIconStyle = {
  fontSize: '16px'
};

const settingsContainerStyle = {
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  minHeight: '400px'
};

const tabContentStyle = {
  animation: 'fadeIn 0.3s ease-in'
};

const sectionTitleStyle = {
  color: '#333',
  margin: '0 0 25px 0',
  fontSize: '22px',
  fontWeight: 'bold',
  borderBottom: '2px solid #f0f0f0',
  paddingBottom: '10px'
};

const settingsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '25px'
};

const toggleGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const labelStyle = {
  fontWeight: 'bold',
  color: '#333',
  fontSize: '14px'
};

const inputStyle = {
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box'
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '80px',
  fontFamily: 'Arial, sans-serif'
};

const colorInputContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const colorInputStyle = {
  width: '50px',
  height: '40px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const colorValueStyle = {
  fontSize: '14px',
  color: '#666',
  fontFamily: 'monospace'
};

const fileUploadStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const browseButtonStyle = {
  padding: '10px 15px',
  border: '1px solid #007bff',
  backgroundColor: 'transparent',
  color: '#007bff',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold'
};

const fileNameStyle = {
  fontSize: '14px',
  color: '#666',
  fontStyle: 'italic'
};

const toggleItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  padding: '15px',
  border: '1px solid #f0f0f0',
  borderRadius: '6px',
  backgroundColor: '#fafafa'
};

const toggleLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontWeight: 'bold',
  color: '#333',
  fontSize: '14px',
  cursor: 'pointer'
};

const toggleDescriptionStyle = {
  fontSize: '12px',
  color: '#666',
  marginLeft: '25px'
};

const checkboxStyle = {
  width: '16px',
  height: '16px',
  cursor: 'pointer'
};

const actionButtonGroupStyle = {
  display: 'flex',
  gap: '15px',
  justifyContent: 'center',
  flexWrap: 'wrap',
  padding: '20px',
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const actionButtonStyle = {
  padding: '12px 25px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  minWidth: '140px',
  transition: 'all 0.3s ease'
};

const secondaryButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white'
};

const infoButtonStyle = {
  backgroundColor: '#17a2b8',
  color: 'white'
};

const successButtonStyle = {
  backgroundColor: '#28a745',
  color: 'white'
};

const closeButtonStyle = {
  backgroundColor: '#ffc107',
  color: '#212529'
};

export default MainPageSetting;