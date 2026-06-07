import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const BulkSMSPage = () => {
  const [filters, setFilters] = useState({
    customerGroup: 'all',
    messageType: 'promotional',
    schedule: 'immediate'
  });

  const [smsData, setSmsData] = useState({
    balance: 0,
    sentToday: 0,
    deliveryRate: 0,
    scheduled: 0
  });

  const [message, setMessage] = useState({
    recipientType: 'customers',
    customerGroup: 'all',
    customNumbers: '',
    message: '',
    senderId: 'STORE',
    schedule: 'immediate',
    scheduledTime: '',
    messageType: 'promotional'
  });

  const [scheduledMessages, setScheduledMessages] = useState([]);

  const [sentMessages, setSentMessages] = useState([]);

  const [customerGroups, setCustomerGroups] = useState([]);

  useEffect(() => {
    fetchSMSData();
    fetchCustomerGroups();
  }, []);

  const fetchSMSData = async () => {
    try {
      const [balanceRes, campaignsRes] = await Promise.all([
        api.get('/sms/balance'),
        api.get('/sms/campaigns')
      ]);

      setSmsData({
        balance: balanceRes.data.balance || 0,
        sentToday: balanceRes.data.sentToday || 0,
        deliveryRate: balanceRes.data.deliveryRate || 0,
        scheduled: campaignsRes.data.filter(c => c.status === 'scheduled').length || 0
      });

      setScheduledMessages(campaignsRes.data.filter(c => c.status === 'scheduled') || []);
      setSentMessages(campaignsRes.data.filter(c => c.status !== 'scheduled') || []);
    } catch (error) {
      console.error('Error fetching SMS data:', error);
    }
  };

  const fetchCustomerGroups = async () => {
    try {
      const response = await api.get('/sms/customer-groups');
      setCustomerGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching customer groups:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMessageChange = (e) => {
    const { name, value } = e.target;
    setMessage(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendSMS = async (e) => {
    e.preventDefault();

    if (!message.message.trim()) {
      alert('Please enter a message');
      return;
    }

    if (message.recipientType === 'customers' && message.customerGroup === '') {
      alert('Please select a customer group');
      return;
    }

    if (message.recipientType === 'custom' && !message.customNumbers.trim()) {
      alert('Please enter phone numbers');
      return;
    }

    try {
      const response = await api.post('/sms/send', {
        recipientType: message.recipientType,
        customerGroup: message.customerGroup,
        customNumbers: message.customNumbers,
        message: message.message,
        senderId: message.senderId,
        messageType: message.messageType,
        schedule: message.schedule
      });

      alert(response.data.message);

      // Refresh data
      fetchSMSData();

      // Reset form
      setMessage({
        recipientType: 'customers',
        customerGroup: 'all',
        customNumbers: '',
        message: '',
        senderId: 'STORE',
        schedule: 'immediate',
        scheduledTime: '',
        messageType: 'promotional'
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Error sending SMS');
    }
  };

  const handleScheduleSMS = () => {
    if (!message.scheduledTime) {
      alert('Please select scheduled time');
      return;
    }

    const recipientCount = message.recipientType === 'custom' 
      ? message.customNumbers.split(',').length 
      : customerGroups.find(g => g.id == message.customerGroup)?.count || 0;

    const newScheduled = {
      id: scheduledMessages.length + 1,
      name: `Scheduled SMS - ${message.scheduledTime}`,
      recipientCount: recipientCount,
      scheduledTime: message.scheduledTime,
      status: 'scheduled',
      messageType: message.messageType
    };

    setScheduledMessages(prev => [newScheduled, ...prev]);
    alert(`SMS scheduled for ${message.scheduledTime}`);
  };

  const handleCancelSchedule = (id) => {
    setScheduledMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const handleBuyCredits = () => {
    alert('Redirecting to credit purchase page...');
  };

  const calculateMessageCount = (text) => {
    return Math.ceil(text.length / 160);
  };

  const calculateCost = () => {
    const messageCount = calculateMessageCount(message.message);
    let recipientCount = 0;

    if (message.recipientType === 'customers') {
      recipientCount = customerGroups.find(g => g.id == message.customerGroup)?.count || 0;
    } else if (message.recipientType === 'custom') {
      recipientCount = message.customNumbers.split(',').filter(num => num.trim()).length;
    }

    return (messageCount * recipientCount * 0.1).toFixed(2);
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'delivered':
        return { backgroundColor: '#10b981', color: 'white' };
      case 'sending':
        return { backgroundColor: '#f59e0b', color: 'white' };
      case 'scheduled':
        return { backgroundColor: '#3b82f6', color: 'white' };
      case 'failed':
        return { backgroundColor: '#ef4444', color: 'white' };
      default:
        return { backgroundColor: '#6b7280', color: 'white' };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const styles = {
    container: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      padding: '0',
      margin: '0'
    },
    header: {
      backgroundColor: 'white',
      padding: '24px',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    headerContent: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1e293b',
      margin: 0
    },
    subtitle: {
      fontSize: '16px',
      color: '#64748b',
      margin: '4px 0 0 0'
    },
    mainContent: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px'
    },
    dashboard: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    },
    card: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '1px solid #e5e7eb'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1e293b',
      margin: 0
    },
    summaryValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '12px 0',
      color: '#1e293b'
    },
    positiveValue: {
      color: '#059669'
    },
    warningValue: {
      color: '#f59e0b'
    },
    negativeValue: {
      color: '#ef4444'
    },
    summaryLabel: {
      fontSize: '14px',
      color: '#64748b',
      fontWeight: '600'
    },
    actionBar: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      flexWrap: 'wrap'
    },
    button: {
      padding: '12px 20px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      minWidth: '140px',
      justifyContent: 'center'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    successButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    warningButton: {
      backgroundColor: '#f59e0b',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    smsComposer: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      marginBottom: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151'
    },
    input: {
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white'
    },
    select: {
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white'
    },
    textarea: {
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white',
      minHeight: '120px',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    messageInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '8px',
      fontSize: '12px',
      color: '#64748b'
    },
    costCalculator: {
      backgroundColor: '#f8fafc',
      padding: '16px',
      borderRadius: '6px',
      marginTop: '16px'
    },
    costRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid #e5e7eb'
    },
    tablesSection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      marginBottom: '24px'
    },
    tableContainer: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    },
    tableHeader: {
      backgroundColor: '#f8fafc',
      padding: '16px 20px',
      borderBottom: '1px solid #e2e8f0'
    },
    tableTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1e293b',
      margin: 0
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px'
    },
    th: {
      backgroundColor: '#f8fafc',
      padding: '12px 16px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#374151',
      borderBottom: '1px solid #e2e8f0'
    },
    td: {
      padding: '12px 16px',
      borderBottom: '1px solid #e2e8f0',
      color: '#4b5563'
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      display: 'inline-block'
    },
    amountCell: {
      textAlign: 'right',
      fontWeight: '500',
      fontFamily: "'Courier New', monospace"
    },
    customerGroups: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    },
    groupCard: {
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      cursor: 'pointer',
      border: '2px solid transparent',
      transition: 'all 0.2s ease'
    },
    selectedGroup: {
      borderColor: '#3b82f6',
      backgroundColor: '#f0f9ff'
    },
    groupName: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      margin: '0 0 8px 0'
    },
    groupCount: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#3b82f6'
    },
    footer: {
      backgroundColor: '#1e293b',
      color: 'white',
      padding: '20px',
      textAlign: 'center',
      fontSize: '12px',
      borderRadius: '8px'
    }
  };

  const recipientCount = message.recipientType === 'customers' 
    ? customerGroups.find(g => g.id == message.customerGroup)?.count || 0
    : message.customNumbers.split(',').filter(num => num.trim()).length;

  const messageCount = calculateMessageCount(message.message);
  const totalCost = calculateCost();

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Bulk SMS</h1>
            <p style={styles.subtitle}>Send promotional and transactional messages to customers</p>
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Dashboard Cards */}
        <div style={styles.dashboard}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>SMS Balance</h3>
              <span style={{color: '#059669', fontSize: '12px', fontWeight: '600'}}>ACTIVE</span>
            </div>
            <div style={{...styles.summaryValue, ...styles.positiveValue}}>
              {smsData.balance}
            </div>
            <div style={styles.summaryLabel}>Available Credits</div>
          </div>
          
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Sent Today</h3>
              <span style={{color: '#3b82f6', fontSize: '12px', fontWeight: '600'}}>TODAY</span>
            </div>
            <div style={styles.summaryValue}>
              {smsData.sentToday}
            </div>
            <div style={styles.summaryLabel}>Messages</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Delivery Rate</h3>
              <span style={{color: '#10b981', fontSize: '12px', fontWeight: '600'}}>HIGH</span>
            </div>
            <div style={{...styles.summaryValue, ...styles.positiveValue}}>
              {smsData.deliveryRate}%
            </div>
            <div style={styles.summaryLabel}>Success Rate</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Scheduled</h3>
              <span style={{color: '#f59e0b', fontSize: '12px', fontWeight: '600'}}>PENDING</span>
            </div>
            <div style={{...styles.summaryValue, ...styles.warningValue}}>
              {smsData.scheduled}
            </div>
            <div style={styles.summaryLabel}>Campaigns</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionBar}>
          <button style={{...styles.button, ...styles.successButton}} onClick={handleBuyCredits}>
            💰 Buy SMS Credits
          </button>
          <button style={{...styles.button, ...styles.secondaryButton}}>
            📊 Delivery Reports
          </button>
          <button style={{...styles.button, ...styles.primaryButton}}>
            👥 Manage Groups
          </button>
          <button style={{...styles.button, ...styles.warningButton}}>
            📋 SMS Templates
          </button>
        </div>

        {/* SMS Composer */}
        <div style={styles.smsComposer}>
          <h3 style={{margin: '0 0 20px 0', color: '#1e293b'}}>Compose Message</h3>
          
          <form onSubmit={handleSendSMS}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Recipient Type</label>
                <select
                  name="recipientType"
                  value={message.recipientType}
                  onChange={handleMessageChange}
                  style={styles.select}
                >
                  <option value="customers">Customer Groups</option>
                  <option value="custom">Custom Numbers</option>
                </select>
              </div>

              {message.recipientType === 'customers' ? (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Customer Group</label>
                  <select
                    name="customerGroup"
                    value={message.customerGroup}
                    onChange={handleMessageChange}
                    style={styles.select}
                  >
                    {customerGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.count} customers)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone Numbers</label>
                  <textarea
                    name="customNumbers"
                    value={message.customNumbers}
                    onChange={handleMessageChange}
                    style={styles.textarea}
                    placeholder="Enter phone numbers separated by commas (e.g., 03001234567, 03129876543)"
                    rows={3}
                  />
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Sender ID</label>
                <select
                  name="senderId"
                  value={message.senderId}
                  onChange={handleMessageChange}
                  style={styles.select}
                >
                  <option value="STORE">STORE</option>
                  <option value="BRAND">BRAND</option>
                  <option value="ALERT">ALERT</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Message Type</label>
                <select
                  name="messageType"
                  value={message.messageType}
                  onChange={handleMessageChange}
                  style={styles.select}
                >
                  <option value="promotional">Promotional</option>
                  <option value="transactional">Transactional</option>
                  <option value="alert">Alert</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Schedule</label>
                <select
                  name="schedule"
                  value={message.schedule}
                  onChange={handleMessageChange}
                  style={styles.select}
                >
                  <option value="immediate">Send Immediately</option>
                  <option value="scheduled">Schedule Later</option>
                </select>
              </div>

              {message.schedule === 'scheduled' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Scheduled Time</label>
                  <input
                    type="datetime-local"
                    name="scheduledTime"
                    value={message.scheduledTime}
                    onChange={handleMessageChange}
                    style={styles.input}
                  />
                </div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Message</label>
              <textarea
                name="message"
                value={message.message}
                onChange={handleMessageChange}
                style={styles.textarea}
                placeholder="Type your message here... (Max 160 characters per SMS)"
                maxLength={480}
                rows={4}
              />
              <div style={styles.messageInfo}>
                <span>
                  {message.message.length} characters • {messageCount} SMS • 
                  Max: {480 - message.message.length} chars left
                </span>
                <span style={{color: message.message.length > 160 ? '#f59e0b' : '#64748b'}}>
                  {messageCount > 1 ? 'Multi-part message' : 'Single SMS'}
                </span>
              </div>
            </div>

            {/* Cost Calculator */}
            <div style={styles.costCalculator}>
              <div style={styles.costRow}>
                <span style={styles.label}>Recipients:</span>
                <span style={styles.amountCell}>{recipientCount}</span>
              </div>
              <div style={styles.costRow}>
                <span style={styles.label}>SMS Parts:</span>
                <span style={styles.amountCell}>{messageCount}</span>
              </div>
              <div style={styles.costRow}>
                <span style={styles.label}>Cost per SMS:</span>
                <span style={styles.amountCell}>PKR 0.10</span>
              </div>
              <div style={{...styles.costRow, borderBottom: 'none'}}>
                <span style={{...styles.label, fontWeight: 'bold'}}>Total Cost:</span>
                <span style={{...styles.amountCell, fontWeight: 'bold', color: '#059669'}}>
                  PKR {totalCost}
                </span>
              </div>
            </div>

            <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
              {message.schedule === 'immediate' ? (
                <button 
                  type="submit"
                  style={{...styles.button, ...styles.primaryButton}}
                  disabled={parseFloat(totalCost) > smsData.balance}
                >
                  📤 Send Now
                </button>
              ) : (
                <button 
                  type="button"
                  style={{...styles.button, ...styles.warningButton}}
                  onClick={handleScheduleSMS}
                  disabled={!message.scheduledTime}
                >
                  ⏰ Schedule SMS
                </button>
              )}
              
              <button 
                type="button"
                style={{...styles.button, ...styles.secondaryButton}}
                onClick={() => setMessage(prev => ({...prev, message: ''}))}
              >
                🗑️ Clear
              </button>
            </div>
          </form>
        </div>

        {/* Customer Groups */}
        <div style={styles.customerGroups}>
          {customerGroups.map(group => (
            <div 
              key={group.id}
              style={{
                ...styles.groupCard,
                ...(message.customerGroup == group.id && styles.selectedGroup)
              }}
              onClick={() => setMessage(prev => ({...prev, customerGroup: group.id}))}
            >
              <div style={styles.groupName}>{group.name}</div>
              <div style={styles.groupCount}>{group.count} customers</div>
            </div>
          ))}
        </div>

        {/* Tables Section */}
        <div style={styles.tablesSection}>
          {/* Scheduled Messages */}
          <div style={styles.tableContainer}>
            <div style={styles.tableHeader}>
              <h3 style={styles.tableTitle}>Scheduled Messages</h3>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Campaign</th>
                  <th style={styles.th}>Recipients</th>
                  <th style={styles.th}>Scheduled Time</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scheduledMessages.map(msg => (
                  <tr key={msg.id}>
                    <td style={styles.td}>{msg.name}</td>
                    <td style={styles.td}>{msg.recipientCount}</td>
                    <td style={styles.td}>{msg.scheduledTime}</td>
                    <td style={styles.td}>
                      <span style={{...styles.statusBadge, ...getStatusStyle(msg.status)}}>
                        {msg.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button 
                        style={{...styles.button, ...styles.dangerButton, padding: '6px 12px', fontSize: '12px'}}
                        onClick={() => handleCancelSchedule(msg.id)}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sent Messages */}
          <div style={styles.tableContainer}>
            <div style={styles.tableHeader}>
              <h3 style={styles.tableTitle}>Recent Sent Messages</h3>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Campaign</th>
                  <th style={styles.th}>Recipients</th>
                  <th style={styles.th}>Sent Time</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {sentMessages.map(msg => (
                  <tr key={msg.id}>
                    <td style={styles.td}>{msg.name}</td>
                    <td style={styles.td}>{msg.recipientCount}</td>
                    <td style={styles.td}>{msg.sentTime}</td>
                    <td style={styles.td}>
                      <span style={{...styles.statusBadge, ...getStatusStyle(msg.status)}}>
                        {msg.status} ({msg.deliveryRate}%)
                      </span>
                    </td>
                    <td style={{...styles.td, ...styles.amountCell}}>
                      PKR {formatCurrency(msg.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div>Bulk SMS System | POS Integration v2.0</div>
          <div style={{marginTop: '8px', opacity: '0.8'}}>
            SMS Rate: PKR 0.10 per part | Delivery reports update every 15 minutes
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkSMSPage;