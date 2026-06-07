import React, { useState } from 'react';

const RestoreBackup = () => {
  const [backupData, setBackupData] = useState({
    backupDate: '',
    backupTime: '',
    backupSize: '',
    backupType: '',
    fileName: '',
    location: ''
  });

  const [backupList, setBackupList] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBackupData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRestore = () => {
    if (selectedBackup) {
      alert(`Restoring backup: ${selectedBackup.fileName}`);
      // Add actual restore logic here
    }
  };

  const handleDelete = () => {
    if (selectedBackup) {
      setBackupList(prev => prev.filter(item => item !== selectedBackup));
      setSelectedBackup(null);
    }
  };

  // Sample backup data
  const sampleBackups = [
    {
      id: 1,
      fileName: 'backup_2024_01_15.zip',
      backupDate: '15-Jan-2024',
      backupTime: '14:30:45',
      backupSize: '2.5 GB',
      backupType: 'Full Backup',
      location: 'Local Server'
    },
    {
      id: 2,
      fileName: 'backup_2024_01_14.zip',
      backupDate: '14-Jan-2024',
      backupTime: '14:30:40',
      backupSize: '2.4 GB',
      backupType: 'Full Backup',
      location: 'Local Server'
    },
    {
      id: 3,
      fileName: 'backup_2024_01_13.zip',
      backupDate: '13-Jan-2024',
      backupTime: '14:30:35',
      backupSize: '2.3 GB',
      backupType: 'Full Backup',
      location: 'Cloud Storage'
    }
  ];

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Restore Backup</h1>
      </div>

      {/* Backup Information Section */}
      <div style={sectionStyle}>
        <div style={gridContainerStyle}>
          {/* Left Column - Backup Details */}
          <div style={columnStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Backup Date</label>
              <input
                type="text"
                name="backupDate"
                value={backupData.backupDate}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Select Date"
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Backup Time</label>
              <input
                type="text"
                name="backupTime"
                value={backupData.backupTime}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Select Time"
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Backup Size</label>
              <input
                type="text"
                name="backupSize"
                value={backupData.backupSize}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Size"
              />
            </div>
          </div>

          {/* Right Column - Additional Details */}
          <div style={columnStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Backup Type</label>
              <select
                name="backupType"
                value={backupData.backupType}
                onChange={handleInputChange}
                style={inputStyle}
              >
                <option value="">Select Type</option>
                <option value="Full Backup">Full Backup</option>
                <option value="Incremental">Incremental</option>
                <option value="Differential">Differential</option>
              </select>
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>File Name</label>
              <input
                type="text"
                name="fileName"
                value={backupData.fileName}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="File name"
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Location</label>
              <input
                type="text"
                name="location"
                value={backupData.location}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Backup location"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={buttonGroupStyle}>
          <button style={{...buttonStyle, ...secondaryButtonStyle}}>
            Reset
          </button>
          <button style={{...buttonStyle, ...primaryButtonStyle}}>
            Search
          </button>
          <button style={{...buttonStyle, ...successButtonStyle}}>
            Browse
          </button>
        </div>
      </div>

      {/* Backup List Section */}
      <div style={sectionStyle}>
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderStyle}>
                <th style={tableHeaderCellStyle}>#</th>
                <th style={tableHeaderCellStyle}>File Name</th>
                <th style={tableHeaderCellStyle}>Date</th>
                <th style={tableHeaderCellStyle}>Time</th>
                <th style={tableHeaderCellStyle}>Size</th>
                <th style={tableHeaderCellStyle}>Type</th>
                <th style={tableHeaderCellStyle}>Location</th>
              </tr>
            </thead>
            <tbody>
              {sampleBackups.map((backup, index) => (
                <tr 
                  key={backup.id}
                  style={{
                    ...tableRowStyle,
                    backgroundColor: selectedBackup?.id === backup.id ? '#e6f3ff' : 'transparent'
                  }}
                  onClick={() => setSelectedBackup(backup)}
                >
                  <td style={tableCellStyle}>{index + 1}</td>
                  <td style={tableCellStyle}>{backup.fileName}</td>
                  <td style={tableCellStyle}>{backup.backupDate}</td>
                  <td style={tableCellStyle}>{backup.backupTime}</td>
                  <td style={tableCellStyle}>{backup.backupSize}</td>
                  <td style={tableCellStyle}>{backup.backupType}</td>
                  <td style={tableCellStyle}>{backup.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sampleBackups.length === 0 && (
          <div style={noDataStyle}>
            No backups found
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div style={sectionStyle}>
        <div style={summaryGridStyle}>
          <div style={summaryItemStyle}>
            <label style={summaryLabelStyle}>Selected Backup:</label>
            <span style={summaryValueStyle}>
              {selectedBackup ? selectedBackup.fileName : 'None'}
            </span>
          </div>
          <div style={summaryItemStyle}>
            <label style={summaryLabelStyle}>Backup Date:</label>
            <span style={summaryValueStyle}>
              {selectedBackup ? selectedBackup.backupDate : 'N/A'}
            </span>
          </div>
          <div style={summaryItemStyle}>
            <label style={summaryLabelStyle}>File Size:</label>
            <span style={summaryValueStyle}>
              {selectedBackup ? selectedBackup.backupSize : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={actionButtonGroupStyle}>
        <button 
          style={{...actionButtonStyle, ...restoreButtonStyle}}
          onClick={handleRestore}
          disabled={!selectedBackup}
        >
          Restore
        </button>
        <button 
          style={{...actionButtonStyle, ...updateButtonStyle}}
          onClick={() => {/* Update logic */}}
        >
          Verify
        </button>
        <button 
          style={{...actionButtonStyle, ...deleteButtonStyle}}
          onClick={handleDelete}
          disabled={!selectedBackup}
        >
          Delete
        </button>
        <button 
          style={{...actionButtonStyle, ...printButtonStyle}}
          onClick={() => window.print()}
        >
          Print
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
  padding: '10px',
  backgroundColor: '#fff',
  borderRadius: '5px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const titleStyle = {
  color: '#333',
  margin: '0',
  fontSize: '24px',
  fontWeight: 'bold'
};

const sectionStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  marginBottom: '20px',
  borderRadius: '5px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const gridContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px',
  marginBottom: '20px'
};

const columnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
};

const labelStyle = {
  fontWeight: 'bold',
  color: '#333',
  fontSize: '14px'
};

const inputStyle = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box'
};

const buttonGroupStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'center',
  flexWrap: 'wrap'
};

const buttonStyle = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  minWidth: '100px'
};

const primaryButtonStyle = {
  backgroundColor: '#007bff',
  color: 'white'
};

const secondaryButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white'
};

const successButtonStyle = {
  backgroundColor: '#28a745',
  color: 'white'
};

const tableContainerStyle = {
  overflowX: 'auto'
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
  fontWeight: 'bold',
  color: '#333'
};

const tableRowStyle = {
  cursor: 'pointer',
  borderBottom: '1px solid #dee2e6'
};

const tableCellStyle = {
  padding: '12px 8px',
  textAlign: 'left'
};

const noDataStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#6c757d',
  fontSize: '16px'
};

const summaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px'
};

const summaryItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
};

const summaryLabelStyle = {
  fontWeight: 'bold',
  color: '#333',
  fontSize: '14px'
};

const summaryValueStyle = {
  color: '#007bff',
  fontSize: '16px',
  fontWeight: 'bold'
};

const actionButtonGroupStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'center',
  flexWrap: 'wrap',
  padding: '20px'
};

const actionButtonStyle = {
  padding: '12px 24px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  minWidth: '120px'
};

const restoreButtonStyle = {
  backgroundColor: '#28a745',
  color: 'white'
};

const updateButtonStyle = {
  backgroundColor: '#17a2b8',
  color: 'white'
};

const deleteButtonStyle = {
  backgroundColor: '#dc3545',
  color: 'white'
};

const printButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white'
};

const closeButtonStyle = {
  backgroundColor: '#ffc107',
  color: '#212529'
};

export default RestoreBackup;