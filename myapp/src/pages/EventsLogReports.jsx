import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const EventLogReport = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    eventType: 'All',
    userId: '',
    module: 'All',
    status: 'All',
    severity: 'All',
    category: 'All'
  });

  const [eventLogs, setEventLogs] = useState([]);
  const [statistics, setStatistics] = useState({
    totalEvents: 0,
    successCount: 0,
    failedCount: 0,
    warningCount: 0,
    infoCount: 0
  });
  const [filterOptions, setFilterOptions] = useState({
    eventTypes: [],
    modules: [],
    statuses: [],
    severities: [],
    categories: [],
    users: []
  });

  const [selectedLog, setSelectedLog] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchFilterOptions();
    fetchEventLogs();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/event-logs/filters');
      setFilterOptions(response.data.data);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const fetchEventLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();

      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.eventType && filters.eventType !== 'All') queryParams.append('eventType', filters.eventType);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.module && filters.module !== 'All') queryParams.append('module', filters.module);
      if (filters.status && filters.status !== 'All') queryParams.append('status', filters.status);
      if (filters.severity && filters.severity !== 'All') queryParams.append('severity', filters.severity);
      if (filters.category && filters.category !== 'All') queryParams.append('category', filters.category);

      const [logsResponse, statsResponse] = await Promise.all([
        api.get(`/event-logs?${queryParams}`),
        api.get(`/event-logs/statistics?${queryParams}`)
      ]);

      setEventLogs(logsResponse.data.data);
      setStatistics(statsResponse.data.data);
    } catch (err) {
      setError('Failed to fetch event logs');
      console.error('Error fetching event logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    fetchEventLogs();
  };

  const handleReset = () => {
    setFilters({
      startDate: '',
      endDate: '',
      eventType: 'All',
      userId: '',
      module: 'All',
      status: 'All',
      severity: 'All',
      category: 'All'
    });
    setTimeout(() => fetchEventLogs(), 100); // Small delay to allow state update
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();

      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.eventType && filters.eventType !== 'All') queryParams.append('eventType', filters.eventType);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.module && filters.module !== 'All') queryParams.append('module', filters.module);
      if (filters.status && filters.status !== 'All') queryParams.append('status', filters.status);

      const response = await api.get(`/event-logs/export?${queryParams}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'event_logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export event logs');
      console.error('Error exporting event logs:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Event Log Report</h1>
      </div>

      {/* Filter Section */}
      <div style={sectionStyle}>
        <div style={filterGridStyle}>
          {/* Date Range */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              style={inputStyle}
            />
          </div>

          <div style={filterGroupStyle}>
            <label style={labelStyle}>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              style={inputStyle}
            />
          </div>

          {/* Event Type */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Event Type</label>
            <select
              name="eventType"
              value={filters.eventType}
              onChange={handleFilterChange}
              style={inputStyle}
            >
              {filterOptions.eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* User ID */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>User ID</label>
            <select
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              style={inputStyle}
            >
              <option value="">All Users</option>
              {filterOptions.users.map(user => (
                <option key={user.userId} value={user.userId}>
                  {user.userId} - {user.userName}
                </option>
              ))}
            </select>
          </div>

          {/* Module */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Module</label>
            <select
              name="module"
              value={filters.module}
              onChange={handleFilterChange}
              style={inputStyle}
            >
              {filterOptions.modules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={inputStyle}
            >
              {filterOptions.statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Severity</label>
            <select
              name="severity"
              value={filters.severity}
              onChange={handleFilterChange}
              style={inputStyle}
            >
              {filterOptions.severities.map(severity => (
                <option key={severity} value={severity}>{severity}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              style={inputStyle}
            >
              {filterOptions.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Action Buttons */}
        <div style={buttonGroupStyle}>
          <button 
            style={{...buttonStyle, ...secondaryButtonStyle}}
            onClick={handleReset}
          >
            Reset
          </button>
          <button 
            style={{...buttonStyle, ...primaryButtonStyle}}
            onClick={handleSearch}
          >
            Search
          </button>
          <button 
            style={{...buttonStyle, ...successButtonStyle}}
            onClick={handleExport}
          >
            Export
          </button>
        </div>
      </div>

      {/* Event Log Table */}
      <div style={sectionStyle}>
        <div style={tableHeaderStyle}>
          <h3 style={tableTitleStyle}>Event Log Details</h3>
          <span style={resultsCountStyle}>
            Showing {eventLogs.length} records
          </span>
        </div>

        {isLoading && (
          <div style={loadingStyle}>
            Loading event logs...
          </div>
        )}

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeaderCellStyle}>#</th>
                <th style={tableHeaderCellStyle}>Date</th>
                <th style={tableHeaderCellStyle}>Time</th>
                <th style={tableHeaderCellStyle}>Event Type</th>
                <th style={tableHeaderCellStyle}>Description</th>
                <th style={tableHeaderCellStyle}>User ID</th>
                <th style={tableHeaderCellStyle}>User Name</th>
                <th style={tableHeaderCellStyle}>Module</th>
                <th style={tableHeaderCellStyle}>IP Address</th>
                <th style={tableHeaderCellStyle}>Status</th>
                <th style={tableHeaderCellStyle}>Severity</th>
                <th style={tableHeaderCellStyle}>Category</th>
              </tr>
            </thead>
            <tbody>
              {eventLogs.map((log, index) => (
                <tr
                  key={log._id || log.id}
                  style={{
                    ...tableRowStyle,
                    backgroundColor: selectedLog?.id === log.id ? '#e6f3ff' : 'transparent'
                  }}
                  onClick={() => setSelectedLog(log)}
                >
                  <td style={tableCellStyle}>{index + 1}</td>
                  <td style={tableCellStyle}>{log.formattedDate || log.date}</td>
                  <td style={tableCellStyle}>{log.time}</td>
                  <td style={tableCellStyle}>
                    <span style={getEventTypeStyle(log.eventType)}>
                      {log.eventType}
                    </span>
                  </td>
                  <td style={{...tableCellStyle, ...descriptionCellStyle}}>
                    {log.description}
                  </td>
                  <td style={tableCellStyle}>{log.userId}</td>
                  <td style={tableCellStyle}>{log.userName}</td>
                  <td style={tableCellStyle}>{log.module}</td>
                  <td style={tableCellStyle}>{log.ipAddress}</td>
                  <td style={tableCellStyle}>
                    <span style={getStatusStyle(log.status)}>
                      {log.status}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={getSeverityStyle(log.severity)}>
                      {log.severity}
                    </span>
                  </td>
                  <td style={tableCellStyle}>{log.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {eventLogs.length === 0 && !isLoading && !error && (
          <div style={noDataStyle}>
            No event logs found for the selected criteria
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div style={sectionStyle}>
        <div style={summaryGridStyle}>
          <div style={summaryItemStyle}>
            <label style={summaryLabelStyle}>Total Events:</label>
            <span style={summaryValueStyle}>{eventLogs.length}</span>
          </div>
          <div style={summaryItemStyle}>
            <label style={summaryLabelStyle}>Successful Events:</label>
            <span style={{...summaryValueStyle, color: '#28a745'}}>
              {eventLogs.filter(log => log.status === 'Success').length}
            </span>
          </div>
          <div style={summaryItemStyle}>
            <label style={summaryLabelStyle}>Failed Events:</label>
            <span style={{...summaryValueStyle, color: '#dc3545'}}>
              {eventLogs.filter(log => log.status === 'Failed').length}
            </span>
          </div>
          <div style={summaryItemStyle}>
            <label style={summaryLabelStyle}>Date Range:</label>
            <span style={summaryValueStyle}>
              {filters.startDate || 'Start'} to {filters.endDate || 'End'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={actionButtonGroupStyle}>
        <button 
          style={{...actionButtonStyle, ...primaryButtonStyle}}
          onClick={handleSearch}
        >
          Refresh
        </button>
        <button 
          style={{...actionButtonStyle, ...successButtonStyle}}
          onClick={handleExport}
        >
          Export to Excel
        </button>
        <button 
          style={{...actionButtonStyle, ...printButtonStyle}}
          onClick={handlePrint}
        >
          Print Report
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

// Style functions for dynamic styling
const getEventTypeStyle = (eventType) => {
  const baseStyle = {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  const typeStyles = {
    'Login': { ...baseStyle, backgroundColor: '#e3f2fd', color: '#1976d2' },
    'Sale': { ...baseStyle, backgroundColor: '#e8f5e8', color: '#2e7d32' },
    'Product Update': { ...baseStyle, backgroundColor: '#fff3e0', color: '#f57c00' },
    'User Management': { ...baseStyle, backgroundColor: '#f3e5f5', color: '#7b1fa2' },
    'Backup': { ...baseStyle, backgroundColor: '#e0f2f1', color: '#00796b' }
  };

  return typeStyles[eventType] || { ...baseStyle, backgroundColor: '#f5f5f5', color: '#666' };
};

const getStatusStyle = (status) => {
  const baseStyle = {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  const statusStyles = {
    'Success': { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' },
    'Failed': { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' },
    'Warning': { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' }
  };

  return statusStyles[status] || baseStyle;
};

const getSeverityStyle = (severity) => {
  const baseStyle = {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  const severityStyles = {
    'Info': { ...baseStyle, backgroundColor: '#d1ecf1', color: '#0c5460' },
    'Warning': { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' },
    'Error': { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' },
    'Critical': { ...baseStyle, backgroundColor: '#f5c6cb', color: '#721c24' }
  };

  return severityStyles[severity] || baseStyle;
};

// Inline Styles
const containerStyle = {
  fontFamily: 'Arial, sans-serif',
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '20px',
  backgroundColor: '#f5f5f5',
  minHeight: '100vh'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '20px',
  padding: '15px',
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

const filterGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px',
  marginBottom: '20px'
};

const filterGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
};

const labelStyle = {
  fontWeight: 'bold',
  color: '#333',
  fontSize: '14px',
  marginBottom: '2px'
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

const tableHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px'
};

const tableTitleStyle = {
  margin: '0',
  color: '#333',
  fontSize: '18px'
};

const resultsCountStyle = {
  color: '#6c757d',
  fontSize: '14px'
};

const tableContainerStyle = {
  overflowX: 'auto',
  border: '1px solid #dee2e6',
  borderRadius: '4px'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
  minWidth: '1200px'
};

const tableHeaderRowStyle = {
  backgroundColor: '#f8f9fa'
};

const tableHeaderCellStyle = {
  padding: '12px 8px',
  textAlign: 'left',
  borderBottom: '2px solid #dee2e6',
  fontWeight: 'bold',
  color: '#333',
  backgroundColor: '#f8f9fa',
  position: 'sticky',
  top: 0
};

const tableRowStyle = {
  cursor: 'pointer',
  borderBottom: '1px solid #dee2e6',
  transition: 'background-color 0.2s'
};

const tableCellStyle = {
  padding: '10px 8px',
  textAlign: 'left',
  borderBottom: '1px solid #dee2e6'
};

const descriptionCellStyle = {
  maxWidth: '200px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const noDataStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#6c757d',
  fontSize: '16px',
  fontStyle: 'italic'
};

const summaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px'
};

const summaryItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  textAlign: 'center'
};

const summaryLabelStyle = {
  fontWeight: 'bold',
  color: '#333',
  fontSize: '14px'
};

const summaryValueStyle = {
  color: '#007bff',
  fontSize: '18px',
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
  minWidth: '140px'
};

const printButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white'
};

const closeButtonStyle = {
  backgroundColor: '#ffc107',
  color: '#212529'
};

const loadingStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#6c757d',
  fontSize: '16px',
  fontStyle: 'italic'
};

const errorStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#dc3545',
  fontSize: '16px',
  fontStyle: 'italic'
};

export default EventLogReport;
