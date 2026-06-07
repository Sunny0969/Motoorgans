import React, { useState } from 'react';

const SMSReports = () => {
  const [filters, setFilters] = useState({
    dateRange: 'last7days',
    status: 'all',
    type: 'all',
    search: ''
  });

  const [selectedReports, setSelectedReports] = useState([]);

  const smsReports = [
    {
      id: 1,
      recipient: '+1 (555) 123-4567',
      message: 'Your order #12345 is ready for pickup. Thank you for shopping with us!',
      type: 'order',
      status: 'delivered',
      cost: 0.15,
      characters: 98,
      date: '2024-03-20 14:30:25',
      messageId: 'SMS001234'
    },
    {
      id: 2,
      recipient: '+1 (555) 987-6543',
      message: 'Hi John, your prescription refill is ready. Pharmacy closing at 8 PM today.',
      type: 'notification',
      status: 'delivered',
      cost: 0.15,
      characters: 87,
      date: '2024-03-20 13:15:42',
      messageId: 'SMS001235'
    },
    {
      id: 3,
      recipient: '+1 (555) 456-7890',
      message: 'Flash Sale! Get 20% off all electronics this weekend. Show this SMS to claim.',
      type: 'promotional',
      status: 'delivered',
      cost: 0.15,
      characters: 105,
      date: '2024-03-20 11:45:18',
      messageId: 'SMS001236'
    },
    {
      id: 4,
      recipient: '+1 (555) 234-5678',
      message: 'Your appointment is confirmed for tomorrow at 2:00 PM. Please arrive 15 mins early.',
      type: 'appointment',
      status: 'failed',
      cost: 0.00,
      characters: 92,
      date: '2024-03-20 10:20:33',
      messageId: 'SMS001237'
    },
    {
      id: 5,
      recipient: '+1 (555) 345-6789',
      message: 'Security Alert: New login detected on your account from unknown device.',
      type: 'alert',
      status: 'delivered',
      cost: 0.15,
      characters: 78,
      date: '2024-03-19 16:55:47',
      messageId: 'SMS001238'
    },
    {
      id: 6,
      recipient: 'VIP Group',
      message: 'Exclusive VIP Preview: New collection launches tomorrow. 25% discount for VIP members only.',
      type: 'promotional',
      status: 'pending',
      cost: 3.75,
      characters: 95,
      date: '2024-03-19 15:30:12',
      messageId: 'SMS001239'
    },
    {
      id: 7,
      recipient: '+1 (555) 567-8901',
      message: 'Payment received: $150.00. Thank you for your payment. Balance: $0.00',
      type: 'transaction',
      status: 'delivered',
      cost: 0.15,
      characters: 82,
      date: '2024-03-19 14:12:08',
      messageId: 'SMS001240'
    },
    {
      id: 8,
      recipient: 'All Customers',
      message: 'Store will be closed on Friday for inventory. We apologize for any inconvenience.',
      type: 'notification',
      status: 'delivered',
      cost: 45.60,
      characters: 88,
      date: '2024-03-19 09:15:29',
      messageId: 'SMS001241'
    }
  ];

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
          <div style={titleStyle}>SMS Reports</div>
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
    maxWidth: '1400px',
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

  // Summary cards style
  const summaryGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  };

  const summaryCardStyle = {
    padding: '20px',
    borderRadius: '8px',
    color: 'white',
    textAlign: 'center'
  };

  // Filter section style
  const filterSectionStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
    alignItems: 'end'
  };

  // Input and select styles
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
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

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
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

  const secondaryButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#95a5a6',
    color: 'white'
  };

  const exportButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#27ae60',
    color: 'white'
  };

  // Table styles
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  };

  const thStyle = {
    backgroundColor: '#f8f9fa',
    padding: '12px 8px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#2c3e50',
    borderBottom: '2px solid #e0e0e0',
    fontSize: '12px',
    textTransform: 'uppercase'
  };

  const tdStyle = {
    padding: '12px 8px',
    borderBottom: '1px solid #e0e0e0',
    verticalAlign: 'top'
  };

  // Status badge styles
  const statusBadgeStyle = (status) => {
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase'
    };

    switch (status) {
      case 'delivered':
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' };
      case 'failed':
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' };
      case 'pending':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
      default:
        return { ...baseStyle, backgroundColor: '#e2e3e5', color: '#383d41' };
    }
  };

  // Type badge styles
  const typeBadgeStyle = (type) => {
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600'
    };

    switch (type) {
      case 'order':
        return { ...baseStyle, backgroundColor: '#d1ecf1', color: '#0c5460' };
      case 'promotional':
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' };
      case 'notification':
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' };
      case 'appointment':
        return { ...baseStyle, backgroundColor: '#e2e3e5', color: '#383d41' };
      case 'alert':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
      case 'transaction':
        return { ...baseStyle, backgroundColor: '#cce7ff', color: '#004085' };
      default:
        return { ...baseStyle, backgroundColor: '#e2e3e5', color: '#383d41' };
    }
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalMessages = smsReports.length;
    const delivered = smsReports.filter(msg => msg.status === 'delivered').length;
    const failed = smsReports.filter(msg => msg.status === 'failed').length;
    const pending = smsReports.filter(msg => msg.status === 'pending').length;
    const totalCost = smsReports.reduce((sum, msg) => sum + msg.cost, 0);

    return { totalMessages, delivered, failed, pending, totalCost };
  };

  const summary = calculateSummary();

  // Filter reports based on filters
  const filteredReports = smsReports.filter(report => {
    const matchesSearch = 
      report.recipient.toLowerCase().includes(filters.search.toLowerCase()) ||
      report.message.toLowerCase().includes(filters.search.toLowerCase()) ||
      report.messageId.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || report.status === filters.status;
    const matchesType = filters.type === 'all' || report.type === filters.type;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectReport = (id) => {
    setSelectedReports(prev =>
      prev.includes(id)
        ? prev.filter(reportId => reportId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedReports(
      selectedReports.length === filteredReports.length
        ? []
        : filteredReports.map(report => report.id)
    );
  };

  const exportReports = () => {
    const dataToExport = selectedReports.length > 0 
      ? smsReports.filter(report => selectedReports.includes(report.id))
      : smsReports;
    
    console.log('Exporting reports:', dataToExport);
    alert(`Exporting ${dataToExport.length} reports...`);
  };

  const [focusedField, setFocusedField] = useState(null);

  return (
    <div style={containerStyle}>
      <Header />
      
      <div style={contentStyle}>
        {/* Summary Cards */}
        <div style={summaryGridStyle}>
          <div style={{...summaryCardStyle, backgroundColor: '#3498db'}}>
            <div style={{fontSize: '24px', fontWeight: 'bold'}}>{summary.totalMessages}</div>
            <div style={{fontSize: '14px'}}>Total Messages</div>
          </div>
          <div style={{...summaryCardStyle, backgroundColor: '#27ae60'}}>
            <div style={{fontSize: '24px', fontWeight: 'bold'}}>{summary.delivered}</div>
            <div style={{fontSize: '14px'}}>Delivered</div>
          </div>
          <div style={{...summaryCardStyle, backgroundColor: '#e74c3c'}}>
            <div style={{fontSize: '24px', fontWeight: 'bold'}}>{summary.failed}</div>
            <div style={{fontSize: '14px'}}>Failed</div>
          </div>
          <div style={{...summaryCardStyle, backgroundColor: '#f39c12'}}>
            <div style={{fontSize: '24px', fontWeight: 'bold'}}>{summary.pending}</div>
            <div style={{fontSize: '14px'}}>Pending</div>
          </div>
          <div style={{...summaryCardStyle, backgroundColor: '#9b59b6'}}>
            <div style={{fontSize: '24px', fontWeight: 'bold'}}>${summary.totalCost.toFixed(2)}</div>
            <div style={{fontSize: '14px'}}>Total Cost</div>
          </div>
        </div>

        {/* Reports Section */}
        <div style={cardStyle}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{color: '#2c3e50', margin: 0}}>SMS Message History</h2>
            <div style={{display: 'flex', gap: '10px'}}>
              <button 
                style={exportButtonStyle}
                onClick={exportReports}
                disabled={filteredReports.length === 0}
              >
                📊 Export Report
              </button>
              <button style={secondaryButtonStyle}>
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={filterSectionStyle}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '12px', color: '#2c3e50'}}>
                Date Range
              </label>
              <select
                style={selectStyle}
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '12px', color: '#2c3e50'}}>
                Status
              </label>
              <select
                style={selectStyle}
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '12px', color: '#2c3e50'}}>
                Message Type
              </label>
              <select
                style={selectStyle}
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="order">Order</option>
                <option value="promotional">Promotional</option>
                <option value="notification">Notification</option>
                <option value="appointment">Appointment</option>
                <option value="alert">Alert</option>
                <option value="transaction">Transaction</option>
              </select>
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '12px', color: '#2c3e50'}}>
                Search
              </label>
              <input
                type="text"
                style={focusedField === 'search' ? inputFocusStyle : inputStyle}
                placeholder="Search by recipient, message, or ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onFocus={() => setFocusedField('search')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
          </div>

          {/* Reports Table */}
          <div style={{overflowX: 'auto'}}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{...thStyle, width: '30px'}}>
                    <input
                      type="checkbox"
                      checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th style={thStyle}>Message ID</th>
                  <th style={thStyle}>Recipient</th>
                  <th style={thStyle}>Message</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Cost</th>
                  <th style={thStyle}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td style={{...tdStyle, textAlign: 'center'}} colSpan="8">
                      No SMS messages found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report.id} style={{
                      backgroundColor: selectedReports.includes(report.id) ? '#f0f8ff' : 'transparent'
                    }}>
                      <td style={tdStyle}>
                        <input
                          type="checkbox"
                          checked={selectedReports.includes(report.id)}
                          onChange={() => handleSelectReport(report.id)}
                        />
                      </td>
                      <td style={{...tdStyle, fontFamily: 'monospace', fontSize: '12px'}}>
                        {report.messageId}
                      </td>
                      <td style={tdStyle}>
                        <div style={{fontWeight: '600'}}>{report.recipient}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{fontWeight: '500', marginBottom: '4px'}}>
                          {report.message.length > 80 ? report.message.substring(0, 80) + '...' : report.message}
                        </div>
                        <div style={{fontSize: '11px', color: '#7f8c8d'}}>
                          {report.characters} characters
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={typeBadgeStyle(report.type)}>
                          {report.type}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={statusBadgeStyle(report.status)}>
                          {report.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{fontWeight: '600', color: '#2c3e50'}}>
                          ${report.cost.toFixed(2)}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{fontSize: '12px', color: '#2c3e50'}}>
                          {report.date.split(' ')[0]}
                        </div>
                        <div style={{fontSize: '11px', color: '#7f8c8d'}}>
                          {report.date.split(' ')[1]}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <div style={{color: '#7f8c8d', fontSize: '14px'}}>
              Showing {filteredReports.length} of {smsReports.length} messages
            </div>
            <div style={{display: 'flex', gap: '8px'}}>
              <button style={secondaryButtonStyle} disabled>← Previous</button>
              <button style={{...primaryButtonStyle, padding: '8px 12px'}}>1</button>
              <button style={{...secondaryButtonStyle, padding: '8px 12px'}}>2</button>
              <button style={{...secondaryButtonStyle, padding: '8px 12px'}}>3</button>
              <button style={secondaryButtonStyle}>Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSReports;