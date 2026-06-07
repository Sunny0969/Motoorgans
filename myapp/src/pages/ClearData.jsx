import React, { useState } from 'react';

const ClearData = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [confirmationText, setConfirmationText] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [clearHistory, setClearHistory] = useState([]);

  const clearOptions = [
    {
      id: 'sales',
      label: 'Sales Records',
      description: 'Clear all sales transactions and invoices',
      warning: 'This will permanently delete all sales records. This action cannot be undone.',
      confirmationText: 'DELETE SALES'
    },
    {
      id: 'products',
      label: 'Product Data',
      description: 'Clear product catalog and inventory data',
      warning: 'This will remove all products and inventory information.',
      confirmationText: 'DELETE PRODUCTS'
    },
    {
      id: 'customers',
      label: 'Customer Data',
      description: 'Clear customer database and records',
      warning: 'This will permanently delete all customer information.',
      confirmationText: 'DELETE CUSTOMERS'
    },
    {
      id: 'transactions',
      label: 'Transaction Logs',
      description: 'Clear all transaction logs and audit trails',
      warning: 'This will remove all transaction history and audit logs.',
      confirmationText: 'DELETE TRANSACTIONS'
    },
    {
      id: 'inventory',
      label: 'Inventory History',
      description: 'Clear inventory movement and stock history',
      warning: 'This will delete all inventory transaction history.',
      confirmationText: 'DELETE INVENTORY'
    },
    {
      id: 'backup',
      label: 'Backup Data',
      description: 'Clear old backup files and temporary data',
      warning: 'This will remove backup files and temporary data.',
      confirmationText: 'DELETE BACKUPS'
    },
    {
      id: 'all',
      label: 'All Data (Reset System)',
      description: 'Complete system reset - clears all data',
      warning: 'WARNING: This will delete ALL data and reset the system to factory defaults.',
      confirmationText: 'RESET ALL DATA'
    }
  ];

  const selectedOptionData = clearOptions.find(option => option.id === selectedOption);

  const handleClearData = () => {
    if (isConfirmed && selectedOption) {
      // Simulate data clearing process
      const timestamp = new Date().toLocaleString();
      const action = `Cleared ${selectedOptionData.label} from ${dateRange.startDate || 'beginning'} to ${dateRange.endDate || 'now'}`;
      
      setClearHistory(prev => [{
        id: Date.now(),
        action,
        timestamp,
        type: selectedOption
      }, ...prev]);

      // Reset form
      setSelectedOption('');
      setDateRange({ startDate: '', endDate: '' });
      setConfirmationText('');
      setIsConfirmed(false);
      
      alert(`Successfully cleared ${selectedOptionData.label}`);
    }
  };

  const handleConfirmationTextChange = (text) => {
    setConfirmationText(text);
    setIsConfirmed(text === selectedOptionData?.confirmationText);
  };

  const getDangerLevel = (optionId) => {
    const dangerLevels = {
      sales: 'high',
      products: 'high',
      customers: 'high',
      transactions: 'medium',
      inventory: 'medium',
      backup: 'low',
      all: 'critical'
    };
    return dangerLevels[optionId] || 'medium';
  };

  const getDangerColor = (level) => {
    const colors = {
      low: '#ffc107',
      medium: '#fd7e14',
      high: '#dc3545',
      critical: '#8b0000'
    };
    return colors[level];
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Clear Data</h1>
        <p style={styles.subtitle}>Manage and clear system data</p>
      </div>

      <div style={styles.content}>
        {/* Left Panel - Options */}
        <div style={styles.leftPanel}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Select Data to Clear</h3>
            <div style={styles.optionsGrid}>
              {clearOptions.map(option => (
                <div
                  key={option.id}
                  style={{
                    ...styles.optionCard,
                    borderColor: selectedOption === option.id ? getDangerColor(getDangerLevel(option.id)) : '#ddd',
                    backgroundColor: selectedOption === option.id ? '#fff8f8' : 'white'
                  }}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <div style={styles.optionHeader}>
                    <h4 style={styles.optionTitle}>{option.label}</h4>
                    <div
                      style={{
                        ...styles.dangerBadge,
                        backgroundColor: getDangerColor(getDangerLevel(option.id))
                      }}
                    >
                      {getDangerLevel(option.id).toUpperCase()}
                    </div>
                  </div>
                  <p style={styles.optionDescription}>{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range Selection */}
          {selectedOption && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Select Date Range</h3>
              <div style={styles.dateRange}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>From Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>To Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.dateNote}>
                <p style={styles.noteText}>
                  Leave dates empty to clear all data. Selecting dates will only clear data within the specified range.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Confirmation */}
        {selectedOption && (
          <div style={styles.rightPanel}>
            <div style={styles.confirmationSection}>
              <div style={styles.warningBox}>
                <div style={styles.warningHeader}>
                  <span style={styles.warningIcon}>⚠️</span>
                  <h3 style={styles.warningTitle}>Warning</h3>
                </div>
                <p style={styles.warningText}>{selectedOptionData.warning}</p>
              </div>

              <div style={styles.confirmationBox}>
                <h4 style={styles.confirmationTitle}>Confirmation Required</h4>
                <p style={styles.confirmationInstruction}>
                  Type <strong>"{selectedOptionData.confirmationText}"</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => handleConfirmationTextChange(e.target.value)}
                  placeholder={`Type ${selectedOptionData.confirmationText} here`}
                  style={{
                    ...styles.confirmationInput,
                    borderColor: isConfirmed ? '#28a745' : '#dc3545',
                    backgroundColor: isConfirmed ? '#f8fff9' : '#fff8f8'
                  }}
                />
                
                <div style={styles.dataSummary}>
                  <h5 style={styles.summaryTitle}>Data to be cleared:</h5>
                  <ul style={styles.summaryList}>
                    <li style={styles.summaryItem}>
                      <strong>Type:</strong> {selectedOptionData.label}
                    </li>
                    <li style={styles.summaryItem}>
                      <strong>Date Range:</strong> {dateRange.startDate || 'Beginning'} to {dateRange.endDate || 'Now'}
                    </li>
                    <li style={styles.summaryItem}>
                      <strong>Estimated Records:</strong> 1,247 records
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleClearData}
                  disabled={!isConfirmed}
                  style={{
                    ...styles.clearButton,
                    backgroundColor: isConfirmed ? getDangerColor(getDangerLevel(selectedOption)) : '#6c757d',
                    cursor: isConfirmed ? 'pointer' : 'not-allowed'
                  }}
                >
                  CLEAR DATA NOW
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear History */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Clear History</h3>
        {clearHistory.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No data clearance operations performed yet.</p>
          </div>
        ) : (
          <div style={styles.historyTable}>
            <div style={styles.tableHeader}>
              <div style={styles.tableCell}>Action</div>
              <div style={styles.tableCell}>Type</div>
              <div style={styles.tableCell}>Timestamp</div>
            </div>
            {clearHistory.map(record => (
              <div key={record.id} style={styles.tableRow}>
                <div style={styles.tableCell}>{record.action}</div>
                <div style={styles.tableCell}>
                  <span
                    style={{
                      ...styles.typeBadge,
                      backgroundColor: getDangerColor(getDangerLevel(record.type))
                    }}
                  >
                    {record.type}
                  </span>
                </div>
                <div style={styles.tableCell}>{record.timestamp}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <div style={styles.safetyNotice}>
        <h4 style={styles.safetyTitle}>Important Safety Notice</h4>
        <ul style={styles.safetyList}>
          <li>Always backup your data before performing any clearance operations</li>
          <li>Data clearance is permanent and cannot be undone</li>
          <li>Some operations may affect system functionality</li>
          <li>Consult with your system administrator before proceeding</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    color: '#dc3545',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 10px 0'
  },
  subtitle: {
    color: '#6c757d',
    fontSize: '16px',
    margin: 0
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '20px',
    marginBottom: '30px'
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column'
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    marginBottom: '15px',
    color: '#333',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px'
  },
  optionCard: {
    padding: '15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      borderColor: '#dc3545',
      backgroundColor: '#fff8f8'
    }
  },
  optionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px'
  },
  optionTitle: {
    margin: '0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  dangerBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold'
  },
  optionDescription: {
    margin: '0',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.4'
  },
  dateRange: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555',
    fontSize: '14px'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  dateNote: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#e7f3ff',
    borderRadius: '4px'
  },
  noteText: {
    margin: '0',
    fontSize: '12px',
    color: '#0066cc'
  },
  confirmationSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  warningBox: {
    padding: '15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px'
  },
  warningHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px'
  },
  warningIcon: {
    fontSize: '20px'
  },
  warningTitle: {
    margin: '0',
    color: '#856404',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  warningText: {
    margin: '0',
    color: '#856404',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  confirmationBox: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px'
  },
  confirmationTitle: {
    margin: '0 0 15px 0',
    color: '#333',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  confirmationInstruction: {
    margin: '0 0 15px 0',
    fontSize: '14px',
    color: '#666'
  },
  confirmationInput: {
    width: '100%',
    padding: '12px',
    border: '2px solid',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '15px',
    boxSizing: 'border-box'
  },
  dataSummary: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  summaryTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  summaryList: {
    margin: '0',
    paddingLeft: '20px'
  },
  summaryItem: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '5px'
  },
  clearButton: {
    width: '100%',
    padding: '15px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease'
  },
  historyTable: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 120px 200px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #ddd',
    fontWeight: 'bold'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 120px 200px',
    borderBottom: '1px solid #eee'
  },
  tableCell: {
    padding: '12px 15px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center'
  },
  typeBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#6c757d'
  },
  emptyText: {
    margin: '0',
    fontSize: '16px'
  },
  safetyNotice: {
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px'
  },
  safetyTitle: {
    margin: '0 0 15px 0',
    color: '#155724',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  safetyList: {
    margin: '0',
    paddingLeft: '20px',
    color: '#155724'
  }
};

export default ClearData;