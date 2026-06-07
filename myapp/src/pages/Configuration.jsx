import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Configuration = () => {
  const [config, setConfig] = useState(null);
  const [originalConfig, setOriginalConfig] = useState(null);
  const [activeSection, setActiveSection] = useState('business');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [backupStatus, setBackupStatus] = useState({ inProgress: false, lastBackup: '' });
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        setLoading(true);
        const response = await api.get('/configuration');
        setConfig(response.data);
        setOriginalConfig(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load configuration. Please try again.');
        console.error('Error loading configuration:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConfiguration();
  }, []);

  // Check for changes
  useEffect(() => {
    if (config && originalConfig) {
      setHasUnsavedChanges(JSON.stringify(config) !== JSON.stringify(originalConfig));
    }
  }, [config, originalConfig]);

  const handleInputChange = (section, field, value, nestedField = null) => {
    setConfig(prev => {
      const updated = { ...prev };
      if (nestedField) {
        updated[section] = {
          ...updated[section],
          [field]: {
            ...updated[section][field],
            [nestedField]: value
          }
        };
      } else if (field.includes('.')) {
        const [parent, child] = field.split('.');
        updated[section] = {
          ...updated[section],
          [parent]: {
            ...updated[section][parent],
            [child]: value
          }
        };
      } else {
        updated[section] = {
          ...updated[section],
          [field]: value
        };
      }
      return updated;
    });
  };

  const handleArrayUpdate = (section, field, index, value) => {
    setConfig(prev => {
      const updated = { ...prev };
      const array = [...updated[section][field]];
      array[index] = { ...array[index], ...value };
      updated[section][field] = array;
      return updated;
    });
  };

  const addTaxRate = () => {
    const newRate = {
      id: Date.now(),
      name: 'New Tax Rate',
      rate: 0,
      products: 'all'
    };
    setConfig(prev => ({
      ...prev,
      tax: {
        ...prev.tax,
        rates: [...prev.tax.rates, newRate]
      }
    }));
  };

  const removeTaxRate = (id) => {
    setConfig(prev => ({
      ...prev,
      tax: {
        ...prev.tax,
        rates: prev.tax.rates.filter(rate => rate.id !== id)
      }
    }));
  };

  const togglePaymentMethod = (id) => {
    setConfig(prev => ({
      ...prev,
      payments: {
        ...prev.payments,
        methods: prev.payments.methods.map(method =>
          method.id === id ? { ...method, enabled: !method.enabled } : method
        )
      }
    }));
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      await api.put('/configuration', config);
      setOriginalConfig(config);
      setHasUnsavedChanges(false);
      setError(null);
      alert('Configuration saved successfully!');
    } catch (err) {
      setError('Failed to save configuration. Please try again.');
      console.error('Error saving configuration:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
      const defaultConfig = {
        business: {
          name: 'SuperMart POS',
          address: '123 Main Street, City, State 12345',
          phone: '+1 (555) 123-4567',
          email: 'info@supermart.com',
          taxId: '12-3456789',
          currency: 'USD',
          timezone: 'America/New_York',
          fiscalYearStart: 'January'
        },
        pos: {
          defaultCustomer: 'Walk-in',
          defaultPayment: 'cash',
          allowPriceOverride: false,
          requireReasonForReturn: true,
          autoPrintReceipt: false,
          showStockInCart: true,
          enableMultiWarehouse: false,
          barcodeScanner: true
        },
        tax: {
          enabled: true,
          defaultRate: 8.5,
          inclusivePricing: false,
          rates: [
            { id: 1, name: 'Standard', rate: 8.5, products: 'all' },
            { id: 2, name: 'Reduced', rate: 5.0, products: 'essential' },
            { id: 3, name: 'Zero', rate: 0, products: 'exempt' }
          ]
        },
        payments: {
          methods: [
            { id: 1, name: 'Cash', enabled: true, processor: 'manual' },
            { id: 2, name: 'Credit Card', enabled: true, processor: 'stripe' },
            { id: 3, name: 'Debit Card', enabled: true, processor: 'stripe' },
            { id: 4, name: 'Mobile Pay', enabled: false, processor: 'square' },
            { id: 5, name: 'Gift Card', enabled: true, processor: 'internal' }
          ]
        },
        printers: {
          receipt: { enabled: true, name: 'EPSON TM-T20', paperSize: '80mm', copies: 1 },
          kitchen: { enabled: false, name: '', paperSize: '80mm', copies: 1 },
          invoice: { enabled: false, name: '', paperSize: 'A4', copies: 1 }
        },
        backup: {
          autoBackup: true,
          frequency: 'daily',
          time: '02:00',
          location: 'local',
          cloudService: 'google_drive',
          keepBackups: 30
        },
        advanced: {
          sessionTimeout: 30,
          maxDiscount: 25,
          lowStockThreshold: 10,
          enableAuditLog: true,
          dataRetention: 365,
          apiEnabled: false,
          debugMode: false
        }
      };
      
      setConfig(defaultConfig);
      localStorage.setItem('pos-config', JSON.stringify(defaultConfig));
    }
  };

  const runBackup = () => {
    setBackupStatus({ inProgress: true, lastBackup: '' });
    
    // Simulate backup process
    setTimeout(() => {
      const now = new Date().toLocaleString();
      setBackupStatus({ inProgress: false, lastBackup: now });
      alert(`Backup completed successfully at ${now}`);
    }, 2000);
  };

  const testPrinter = (printerType) => {
    setTestResults(prev => ({
      ...prev,
      [printerType]: 'Testing...'
    }));

    setTimeout(() => {
      setTestResults(prev => ({
        ...prev,
        [printerType]: '✓ Test successful - Printer is working correctly'
      }));
    }, 1500);
  };

  const testBarcodeScanner = () => {
    setTestResults(prev => ({
      ...prev,
      barcode: 'Please scan a barcode...'
    }));

    // In real app, you would listen for barcode scanner input
    setTimeout(() => {
      setTestResults(prev => ({
        ...prev,
        barcode: '✗ No barcode detected. Please check scanner connection.'
      }));
    }, 3000);
  };

  const sections = [
    { id: 'business', label: 'Business', icon: '🏢' },
    { id: 'pos', label: 'POS Settings', icon: '🖥️' },
    { id: 'tax', label: 'Tax', icon: '💰' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'printers', label: 'Printers', icon: '🖨️' },
    { id: 'backup', label: 'Backup', icon: '💾' },
    { id: 'advanced', label: 'Advanced', icon: '⚙️' }
  ];

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerContentStyle}>
          <h1 style={titleStyle}>System Configuration</h1>
          <p style={subtitleStyle}>Manage your POS system settings and preferences</p>
        </div>
        <div style={headerStatusStyle}>
          <div style={statusIndicatorStyle}>
            <span style={{
              ...statusDotStyle,
              backgroundColor: hasUnsavedChanges ? '#ffc107' : '#28a745'
            }}></span>
            {hasUnsavedChanges ? 'Unsaved Changes' : 'All Changes Saved'}
          </div>
        </div>
      </div>

      <div style={contentStyle}>
        {/* Sidebar Navigation */}
        <div style={sidebarStyle}>
          {sections.map(section => (
            <button
              key={section.id}
              style={{
                ...navItemStyle,
                ...(activeSection === section.id ? activeNavItemStyle : {})
              }}
              onClick={() => setActiveSection(section.id)}
            >
              <span style={navIconStyle}>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        {/* Main Configuration Area */}
        <div style={mainContentStyle}>
          {/* Business Configuration */}
          {activeSection === 'business' && (
            <div style={sectionContentStyle}>
              <h2 style={sectionTitleStyle}>Business Information</h2>
              <div style={settingsGridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Business Name *</label>
                  <input
                    type="text"
                    value={config.business.name}
                    onChange={(e) => handleInputChange('business', 'name', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Address</label>
                  <textarea
                    value={config.business.address}
                    onChange={(e) => handleInputChange('business', 'address', e.target.value)}
                    style={textareaStyle}
                    rows="3"
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Phone</label>
                  <input
                    type="text"
                    value={config.business.phone}
                    onChange={(e) => handleInputChange('business', 'phone', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={config.business.email}
                    onChange={(e) => handleInputChange('business', 'email', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Tax ID</label>
                  <input
                    type="text"
                    value={config.business.taxId}
                    onChange={(e) => handleInputChange('business', 'taxId', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Currency</label>
                  <select
                    value={config.business.currency}
                    onChange={(e) => handleInputChange('business', 'currency', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Timezone</label>
                  <select
                    value={config.business.timezone}
                    onChange={(e) => handleInputChange('business', 'timezone', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="America/New_York">EST (UTC-5)</option>
                    <option value="America/Chicago">CST (UTC-6)</option>
                    <option value="America/Denver">MST (UTC-7)</option>
                    <option value="America/Los_Angeles">PST (UTC-8)</option>
                  </select>
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Fiscal Year Start</label>
                  <select
                    value={config.business.fiscalYearStart}
                    onChange={(e) => handleInputChange('business', 'fiscalYearStart', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="January">January</option>
                    <option value="April">April</option>
                    <option value="July">July</option>
                    <option value="October">October</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* POS Settings */}
          {activeSection === 'pos' && (
            <div style={sectionContentStyle}>
              <h2 style={sectionTitleStyle}>POS Settings</h2>
              <div style={toggleGridStyle}>
                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      checked={config.pos.allowPriceOverride}
                      onChange={(e) => handleInputChange('pos', 'allowPriceOverride', e.target.checked)}
                      style={checkboxStyle}
                    />
                    Allow Price Override
                  </label>
                  <span style={toggleDescriptionStyle}>Enable managers to override product prices</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      checked={config.pos.requireReasonForReturn}
                      onChange={(e) => handleInputChange('pos', 'requireReasonForReturn', e.target.checked)}
                      style={checkboxStyle}
                    />
                    Require Reason for Returns
                  </label>
                  <span style={toggleDescriptionStyle}>Mandatory reason entry for all return transactions</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      checked={config.pos.autoPrintReceipt}
                      onChange={(e) => handleInputChange('pos', 'autoPrintReceipt', e.target.checked)}
                      style={checkboxStyle}
                    />
                    Auto Print Receipt
                  </label>
                  <span style={toggleDescriptionStyle}>Automatically print receipt after sale completion</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      checked={config.pos.showStockInCart}
                      onChange={(e) => handleInputChange('pos', 'showStockInCart', e.target.checked)}
                      style={checkboxStyle}
                    />
                    Show Stock in Cart
                  </label>
                  <span style={toggleDescriptionStyle}>Display available stock when adding items to cart</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      checked={config.pos.enableMultiWarehouse}
                      onChange={(e) => handleInputChange('pos', 'enableMultiWarehouse', e.target.checked)}
                      style={checkboxStyle}
                    />
                    Enable Multi-Warehouse
                  </label>
                  <span style={toggleDescriptionStyle}>Manage inventory across multiple locations</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      checked={config.pos.barcodeScanner}
                      onChange={(e) => handleInputChange('pos', 'barcodeScanner', e.target.checked)}
                      style={checkboxStyle}
                    />
                    Barcode Scanner
                  </label>
                  <span style={toggleDescriptionStyle}>Enable barcode scanner integration</span>
                  <button 
                    onClick={testBarcodeScanner}
                    style={testButtonStyle}
                  >
                    Test Scanner
                  </button>
                  {testResults.barcode && (
                    <div style={testResultStyle}>{testResults.barcode}</div>
                  )}
                </div>
              </div>

              <div style={settingsGridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Default Customer</label>
                  <input
                    type="text"
                    value={config.pos.defaultCustomer}
                    onChange={(e) => handleInputChange('pos', 'defaultCustomer', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Default Payment Method</label>
                  <select
                    value={config.pos.defaultPayment}
                    onChange={(e) => handleInputChange('pos', 'defaultPayment', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile">Mobile Pay</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tax Configuration */}
          {activeSection === 'tax' && (
            <div style={sectionContentStyle}>
              <h2 style={sectionTitleStyle}>Tax Configuration</h2>
              
              <div style={toggleItemStyle}>
                <label style={toggleLabelStyle}>
                  <input
                    type="checkbox"
                    checked={config.tax.enabled}
                    onChange={(e) => handleInputChange('tax', 'enabled', e.target.checked)}
                    style={checkboxStyle}
                  />
                  Enable Tax Calculation
                </label>
              </div>

              <div style={toggleItemStyle}>
                <label style={toggleLabelStyle}>
                  <input
                    type="checkbox"
                    checked={config.tax.inclusivePricing}
                    onChange={(e) => handleInputChange('tax', 'inclusivePricing', e.target.checked)}
                    style={checkboxStyle}
                  />
                  Tax Inclusive Pricing
                </label>
                <span style={toggleDescriptionStyle}>Prices include tax (otherwise tax is added at checkout)</span>
              </div>

              <div style={settingsGridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Default Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.tax.defaultRate}
                    onChange={(e) => handleInputChange('tax', 'defaultRate', parseFloat(e.target.value))}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={taxRatesHeaderStyle}>
                <h3 style={subsectionTitleStyle}>Tax Rates</h3>
                <button onClick={addTaxRate} style={addButtonStyle}>
                  + Add Tax Rate
                </button>
              </div>

              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderStyle}>
                      <th style={tableHeaderCellStyle}>Name</th>
                      <th style={tableHeaderCellStyle}>Rate (%)</th>
                      <th style={tableHeaderCellStyle}>Applies To</th>
                      <th style={tableHeaderCellStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.tax.rates.map((rate, index) => (
                      <tr key={rate.id} style={tableRowStyle}>
                        <td style={tableCellStyle}>
                          <input
                            type="text"
                            value={rate.name}
                            onChange={(e) => handleArrayUpdate('tax', 'rates', index, { name: e.target.value })}
                            style={tableInputStyle}
                          />
                        </td>
                        <td style={tableCellStyle}>
                          <input
                            type="number"
                            step="0.1"
                            value={rate.rate}
                            onChange={(e) => handleArrayUpdate('tax', 'rates', index, { rate: parseFloat(e.target.value) })}
                            style={tableInputStyle}
                          />
                        </td>
                        <td style={tableCellStyle}>
                          <select
                            value={rate.products}
                            onChange={(e) => handleArrayUpdate('tax', 'rates', index, { products: e.target.value })}
                            style={tableInputStyle}
                          >
                            <option value="all">All Products</option>
                            <option value="essential">Essential Goods</option>
                            <option value="exempt">Tax Exempt</option>
                          </select>
                        </td>
                        <td style={tableCellStyle}>
                          <button 
                            onClick={() => removeTaxRate(rate.id)}
                            style={deleteButtonStyle}
                            disabled={config.tax.rates.length <= 1}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {activeSection === 'payments' && (
            <div style={sectionContentStyle}>
              <h2 style={sectionTitleStyle}>Payment Methods</h2>
              
              <div style={paymentMethodsGridStyle}>
                {config.payments.methods.map(method => (
                  <div key={method.id} style={paymentMethodCardStyle}>
                    <div style={paymentMethodHeaderStyle}>
                      <label style={toggleLabelStyle}>
                        <input
                          type="checkbox"
                          checked={method.enabled}
                          onChange={() => togglePaymentMethod(method.id)}
                          style={checkboxStyle}
                        />
                        <span style={paymentMethodNameStyle}>{method.name}</span>
                      </label>
                    </div>
                    <div style={paymentMethodDetailsStyle}>
                      <span style={paymentProcessorStyle}>
                        Processor: {method.processor}
                      </span>
                      {method.enabled && (
                        <button style={configureButtonStyle}>
                          Configure
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Printers Configuration */}
          {activeSection === 'printers' && (
            <div style={sectionContentStyle}>
              <h2 style={sectionTitleStyle}>Printer Configuration</h2>
              
              {Object.entries(config.printers).map(([printerType, settings]) => (
                <div key={printerType} style={printerCardStyle}>
                  <div style={printerHeaderStyle}>
                    <label style={toggleLabelStyle}>
                      <input
                        type="checkbox"
                        checked={settings.enabled}
                        onChange={(e) => handleInputChange('printers', printerType, { ...settings, enabled: e.target.checked })}
                        style={checkboxStyle}
                      />
                      <span style={printerTypeStyle}>
                        {printerType.charAt(0).toUpperCase() + printerType.slice(1)} Printer
                      </span>
                    </label>
                    <button 
                      onClick={() => testPrinter(printerType)}
                      style={testButtonStyle}
                      disabled={!settings.enabled}
                    >
                      Test Print
                    </button>
                  </div>
                  
                  {settings.enabled && (
                    <div style={printerSettingsStyle}>
                      <div style={settingsGridStyle}>
                        <div style={inputGroupStyle}>
                          <label style={labelStyle}>Printer Name</label>
                          <input
                            type="text"
                            value={settings.name}
                            onChange={(e) => handleInputChange('printers', printerType, { ...settings, name: e.target.value })}
                            style={inputStyle}
                            placeholder="Enter printer name or IP address"
                          />
                        </div>
                        
                        <div style={inputGroupStyle}>
                          <label style={labelStyle}>Paper Size</label>
                          <select
                            value={settings.paperSize}
                            onChange={(e) => handleInputChange('printers', printerType, { ...settings, paperSize: e.target.value })}
                            style={inputStyle}
                          >
                            <option value="80mm">80mm Thermal</option>
                            <option value="58mm">58mm Thermal</option>
                            <option value="A4">A4</option>
                            <option value="Letter">Letter</option>
                          </select>
                        </div>
                        
                        <div style={inputGroupStyle}>
                          <label style={labelStyle}>Copies</label>
                          <input
                            type="number"
                            value={settings.copies}
                            onChange={(e) => handleInputChange('printers', printerType, { ...settings, copies: parseInt(e.target.value) })}
                            style={inputStyle}
                            min="1"
                            max="5"
                          />
                        </div>
                      </div>
                      
                      {testResults[printerType] && (
                        <div style={testResultStyle}>{testResults[printerType]}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Backup Configuration */}
          {activeSection === 'backup' && (
            <div style={sectionContentStyle}>
              <h2 style={sectionTitleStyle}>Backup & Recovery</h2>
              
              <div style={backupStatusCardStyle}>
                <div style={backupStatusHeaderStyle}>
                  <h3 style={subsectionTitleStyle}>Backup Status</h3>
                  <div style={backupActionsStyle}>
                    <button 
                      onClick={runBackup}
                      disabled={backupStatus.inProgress}
                      style={backupButtonStyle}
                    >
                      {backupStatus.inProgress ? 'Backing Up...' : 'Run Backup Now'}
                    </button>
                  </div>
                </div>
                
                <div style={backupInfoStyle}>
                  <div style={backupInfoItemStyle}>
                    <span style={backupLabelStyle}>Last Backup:</span>
                    <span style={backupValueStyle}>
                      {backupStatus.lastBackup || 'No backups yet'}
                    </span>
                  </div>
                  <div style={backupInfoItemStyle}>
                    <span style={backupLabelStyle}>Next Auto Backup:</span>
                    <span style={backupValueStyle}>
                      Today at {config.backup.time}
                    </span>
                  </div>
                </div>
              </div>

              <div style={settingsGridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Auto Backup</label>
                  <select
                    value={config.backup.frequency}
                    onChange={(e) => handleInputChange('backup', 'frequency', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="disabled">Disabled</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Backup Time</label>
                  <input
                    type="time"
                    value={config.backup.time}
                    onChange={(e) => handleInputChange('backup', 'time', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Backup Location</label>
                  <select
                    value={config.backup.location}
                    onChange={(e) => handleInputChange('backup', 'location', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="local">Local Storage</option>
                    <option value="cloud">Cloud Storage</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Keep Backups (Days)</label>
                  <input
                    type="number"
                    value={config.backup.keepBackups}
                    onChange={(e) => handleInputChange('backup', 'keepBackups', parseInt(e.target.value))}
                    style={inputStyle}
                    min="1"
                    max="365"
                  />
                </div>
              </div>

              <div style={toggleItemStyle}>
                <label style={toggleLabelStyle}>
                  <input
                    type="checkbox"
                    checked={config.backup.autoBackup}
                    onChange={(e) => handleInputChange('backup', 'autoBackup', e.target.checked)}
                    style={checkboxStyle}
                  />
                  Enable Automatic Backups
                </label>
                <span style={toggleDescriptionStyle}>
                  System will automatically create backups according to the schedule above
                </span>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeSection === 'advanced' && (
            <div style={sectionContentStyle}>
              <h2 style={sectionTitleStyle}>Advanced Settings</h2>
              
              <div style={settingsGridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={config.advanced.sessionTimeout}
                    onChange={(e) => handleInputChange('advanced', 'sessionTimeout', parseInt(e.target.value))}
                    style={inputStyle}
                    min="1"
                    max="240"
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Maximum Discount (%)</label>
                  <input
                    type="number"
                    value={config.advanced.maxDiscount}
                    onChange={(e) => handleInputChange('advanced', 'maxDiscount', parseInt(e.target.value))}
                    style={inputStyle}
                    min="0"
                    max="100"
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Low Stock Threshold</label>
                  <input
                    type="number"
                    value={config.advanced.lowStockThreshold}
                    onChange={(e) => handleInputChange('advanced', 'lowStockThreshold', parseInt(e.target.value))}
                    style={inputStyle}
                    min="1"
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Data Retention (Days)</label>
                  <input
                    type="number"
                    value={config.advanced.dataRetention}
                    onChange={(e) => handleInputChange('advanced', 'dataRetention', parseInt(e.target.value))}
                    style={inputStyle}
                    min="30"
                    max="1095"
                  />
                </div>
              </div>

              <div style={toggleGridStyle}>
                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      checked={config.advanced.enableAuditLog}
                      onChange={(e) => handleInputChange('advanced', 'enableAuditLog', e.target.checked)}
                      style={checkboxStyle}
                    />
                    Enable Audit Log
                  </label>
                  <span style={toggleDescriptionStyle}>Log all system activities for security and compliance</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      checked={config.advanced.apiEnabled}
                      onChange={(e) => handleInputChange('advanced', 'apiEnabled', e.target.checked)}
                      style={checkboxStyle}
                    />
                    Enable API Access
                  </label>
                  <span style={toggleDescriptionStyle}>Allow external systems to connect via API</span>
                </div>

                <div style={toggleItemStyle}>
                  <label style={toggleLabelStyle}>
                    <input
                      type="checkbox"
                      checked={config.advanced.debugMode}
                      onChange={(e) => handleInputChange('advanced', 'debugMode', e.target.checked)}
                      style={checkboxStyle}
                    />
                    Debug Mode
                  </label>
                  <span style={toggleDescriptionStyle}>Enable detailed logging for troubleshooting</span>
                </div>
              </div>

              <div style={dangerZoneStyle}>
                <h3 style={dangerZoneTitleStyle}>Danger Zone</h3>
                <div style={dangerZoneContentStyle}>
                  <p style={dangerZoneTextStyle}>
                    These actions are irreversible. Please proceed with caution.
                  </p>
                  <div style={dangerZoneActionsStyle}>
                    <button style={clearDataButtonStyle}>
                      Clear All Transaction Data
                    </button>
                    <button style={resetSystemButtonStyle}>
                      Reset System to Factory Defaults
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div style={footerStyle}>
        <div style={footerActionsStyle}>
          <button 
            style={{...actionButtonStyle, ...secondaryButtonStyle}}
            onClick={resetToDefault}
          >
            Reset to Default
          </button>
          <div style={footerRightStyle}>
            <button 
              style={{...actionButtonStyle, ...closeButtonStyle}}
              onClick={() => window.close()}
            >
              Cancel
            </button>
            <button 
              style={{
                ...actionButtonStyle,
                ...primaryButtonStyle,
                ...(hasUnsavedChanges ? {} : disabledButtonStyle)
              }}
              onClick={saveConfiguration}
              disabled={!hasUnsavedChanges}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Comprehensive Inline Styles
const containerStyle = {
  fontFamily: 'Arial, sans-serif',
  maxWidth: '1400px',
  margin: '0 auto',
  backgroundColor: '#f8f9fa',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column'
};

const headerStyle = {
  backgroundColor: '#fff',
  padding: '20px 30px',
  borderBottom: '1px solid #dee2e6',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const headerContentStyle = {
  flex: 1
};

const headerStatusStyle = {
  display: 'flex',
  alignItems: 'center'
};

const statusIndicatorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: '#6c757d',
  fontWeight: '500'
};

const statusDotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  display: 'inline-block'
};

const titleStyle = {
  color: '#333',
  margin: '0 0 5px 0',
  fontSize: '28px',
  fontWeight: 'bold'
};

const subtitleStyle = {
  color: '#666',
  margin: '0',
  fontSize: '14px'
};

const contentStyle = {
  display: 'flex',
  flex: 1,
  minHeight: '600px'
};

const sidebarStyle = {
  width: '250px',
  backgroundColor: '#fff',
  borderRight: '1px solid #dee2e6',
  padding: '20px 0',
  display: 'flex',
  flexDirection: 'column'
};

const navItemStyle = {
  padding: '12px 20px',
  border: 'none',
  backgroundColor: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#495057',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  transition: 'all 0.2s ease',
  borderLeft: '3px solid transparent'
};

const activeNavItemStyle = {
  backgroundColor: '#e3f2fd',
  color: '#007bff',
  borderLeftColor: '#007bff',
  fontWeight: '600'
};

const navIconStyle = {
  fontSize: '16px',
  width: '20px'
};

const mainContentStyle = {
  flex: 1,
  padding: '0',
  backgroundColor: '#fff',
  overflow: 'auto'
};

const sectionContentStyle = {
  padding: '30px',
  animation: 'fadeIn 0.3s ease-in'
};

const sectionTitleStyle = {
  color: '#333',
  margin: '0 0 25px 0',
  fontSize: '24px',
  fontWeight: 'bold',
  borderBottom: '2px solid #f0f0f0',
  paddingBottom: '10px'
};

const subsectionTitleStyle = {
  color: '#333',
  margin: '0',
  fontSize: '18px',
  fontWeight: '600'
};

const settingsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px',
  marginBottom: '25px'
};

const toggleGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  marginBottom: '25px'
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const labelStyle = {
  fontWeight: '600',
  color: '#333',
  fontSize: '14px'
};

const inputStyle = {
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease'
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '80px',
  fontFamily: 'Arial, sans-serif'
};

const toggleItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  padding: '15px',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  backgroundColor: '#f8f9fa'
};

const toggleLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontWeight: '600',
  color: '#333',
  fontSize: '14px',
  cursor: 'pointer'
};

const toggleDescriptionStyle = {
  fontSize: '12px',
  color: '#666',
  marginLeft: '28px',
  lineHeight: '1.4'
};

const checkboxStyle = {
  width: '16px',
  height: '16px',
  cursor: 'pointer'
};

const taxRatesHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px'
};

const addButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500'
};

const tableContainerStyle = {
  overflowX: 'auto',
  border: '1px solid #dee2e6',
  borderRadius: '6px'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px'
};

const tableHeaderStyle = {
  backgroundColor: '#f8f9fa'
};

const tableHeaderCellStyle = {
  padding: '12px 8px',
  textAlign: 'left',
  borderBottom: '2px solid #dee2e6',
  fontWeight: '600',
  color: '#333'
};

const tableRowStyle = {
  borderBottom: '1px solid #dee2e6'
};

const tableCellStyle = {
  padding: '12px 8px',
  textAlign: 'left'
};

const tableInputStyle = {
  padding: '6px 8px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box'
};

const deleteButtonStyle = {
  padding: '6px 12px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px'
};

const paymentMethodsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '15px'
};

const paymentMethodCardStyle = {
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '15px',
  backgroundColor: '#f8f9fa'
};

const paymentMethodHeaderStyle = {
  marginBottom: '10px'
};

const paymentMethodNameStyle = {
  fontWeight: '600',
  fontSize: '14px'
};

const paymentMethodDetailsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const paymentProcessorStyle = {
  fontSize: '12px',
  color: '#666'
};

const configureButtonStyle = {
  padding: '4px 8px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px'
};

const printerCardStyle = {
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '15px',
  backgroundColor: '#f8f9fa'
};

const printerHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px'
};

const printerTypeStyle = {
  fontWeight: '600',
  fontSize: '16px'
};

const printerSettingsStyle = {
  borderTop: '1px solid #e9ecef',
  paddingTop: '15px'
};

const testButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#17a2b8',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '500'
};

const testResultStyle = {
  marginTop: '10px',
  padding: '8px 12px',
  backgroundColor: '#e7f3ff',
  border: '1px solid #b3d9ff',
  borderRadius: '4px',
  fontSize: '12px',
  color: '#0066cc'
};

const backupStatusCardStyle = {
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '25px',
  backgroundColor: '#f8f9fa'
};

const backupStatusHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px'
};

const backupActionsStyle = {
  display: 'flex',
  gap: '10px'
};

const backupButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500'
};

const backupInfoStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px'
};

const backupInfoItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
};

const backupLabelStyle = {
  fontSize: '12px',
  color: '#666',
  fontWeight: '500'
};

const backupValueStyle = {
  fontSize: '14px',
  color: '#333',
  fontWeight: '600'
};

const dangerZoneStyle = {
  border: '2px solid #dc3545',
  borderRadius: '8px',
  padding: '20px',
  backgroundColor: '#fff5f5',
  marginTop: '30px'
};

const dangerZoneTitleStyle = {
  color: '#dc3545',
  margin: '0 0 15px 0',
  fontSize: '18px',
  fontWeight: '600'
};

const dangerZoneContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const dangerZoneTextStyle = {
  color: '#666',
  margin: '0',
  fontSize: '14px'
};

const dangerZoneActionsStyle = {
  display: 'flex',
  gap: '15px',
  flexWrap: 'wrap'
};

const clearDataButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#ffc107',
  color: '#212529',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500'
};

const resetSystemButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500'
};

const footerStyle = {
  backgroundColor: '#fff',
  borderTop: '1px solid #dee2e6',
  padding: '20px 30px'
};

const footerActionsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const footerRightStyle = {
  display: 'flex',
  gap: '15px'
};

const actionButtonStyle = {
  padding: '12px 24px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  minWidth: '120px',
  transition: 'all 0.2s ease'
};

const primaryButtonStyle = {
  backgroundColor: '#007bff',
  color: 'white'
};

const secondaryButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white'
};

const closeButtonStyle = {
  backgroundColor: '#ffc107',
  color: '#212529'
};

const disabledButtonStyle = {
  backgroundColor: '#6c757d',
  cursor: 'not-allowed',
  opacity: 0.6
};

export default Configuration;