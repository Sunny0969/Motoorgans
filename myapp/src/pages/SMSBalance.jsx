import React, { useState, useEffect } from 'react';

const SmsBalance = () => {
  const [smsData, setSmsData] = useState({
    balance: 250,
    totalSms: 1000,
    usedSms: 750,
    validity: '2024-12-31',
    status: 'active',
    lowBalanceAlert: true,
    alertThreshold: 100,
    autoTopUp: false,
    topUpAmount: 500
  });

  const [smsHistory, setSmsHistory] = useState([
    {
      id: 1,
      date: '15-Jan-2024',
      time: '14:30:45',
      type: 'Promotional',
      recipient: '+1234567890',
      message: 'Special offer: 20% off all items this weekend!',
      status: 'Delivered',
      cost: 1,
      length: 160
    },
    {
      id: 2,
      date: '15-Jan-2024',
      time: '12:15:20',
      type: 'Transactional',
      recipient: '+1234567891',
      message: 'Your order #12345 has been shipped. Tracking: XYZ123',
      status: 'Delivered',
      cost: 1,
      length: 120
    },
    {
      id: 3,
      date: '14-Jan-2024',
      type: 'Promotional',
      recipient: '+1234567892',
      message: 'New arrivals in stock! Visit us today for the latest products.',
      status: 'Failed',
      cost: 0,
      length: 140,
      time: '16:45:30'
    },
    {
      id: 4,
      date: '14-Jan-2024',
      time: '10:20:15',
      type: 'Transactional',
      recipient: '+1234567893',
      message: 'Payment received for invoice #INV-6789. Thank you!',
      status: 'Delivered',
      cost: 1,
      length: 95
    },
    {
      id: 5,
      date: '13-Jan-2024',
      time: '09:15:40',
      type: 'Alert',
      recipient: '+1234567894',
      message: 'Low stock alert: Product XYZ has only 5 units left.',
      status: 'Delivered',
      cost: 1,
      length: 80
    }
  ]);

  const [topUpPlans, setTopUpPlans] = useState([
    { id: 1, smsCount: 100, cost: 15.00, validity: '30 days', popular: false },
    { id: 2, smsCount: 500, cost: 65.00, validity: '90 days', popular: true },
    { id: 3, smsCount: 1000, cost: 120.00, validity: '180 days', popular: false },
    { id: 4, smsCount: 2500, cost: 275.00, validity: '365 days', popular: false },
    { id: 5, smsCount: 5000, cost: 500.00, validity: '365 days', popular: false }
  ]);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all',
    status: 'all'
  });

  // Calculate usage statistics
  const usageStats = {
    promotional: smsHistory.filter(sms => sms.type === 'Promotional').length,
    transactional: smsHistory.filter(sms => sms.type === 'Transactional').length,
    alerts: smsHistory.filter(sms => sms.type === 'Alert').length,
    delivered: smsHistory.filter(sms => sms.status === 'Delivered').length,
    failed: smsHistory.filter(sms => sms.status === 'Failed').length,
    totalCost: smsHistory.reduce((sum, sms) => sum + sms.cost, 0)
  };

  // Filter SMS history
  const filteredHistory = smsHistory.filter(sms => {
    const matchesDate = (!filter.dateFrom || sms.date >= filter.dateFrom) &&
                       (!filter.dateTo || sms.date <= filter.dateTo);
    const matchesType = filter.type === 'all' || sms.type.toLowerCase().includes(filter.type.toLowerCase());
    const matchesStatus = filter.status === 'all' || sms.status.toLowerCase() === filter.status.toLowerCase();
    
    return matchesDate && matchesType && matchesStatus;
  });

  const handleTopUp = async (plan = null) => {
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (plan) {
      // Package top-up
      setSmsData(prev => ({
        ...prev,
        balance: prev.balance + plan.smsCount,
        totalSms: prev.totalSms + plan.smsCount
      }));
      alert(`Successfully added ${plan.smsCount} SMS to your account!`);
    } else if (topUpAmount) {
      // Custom top-up
      const amount = parseInt(topUpAmount);
      setSmsData(prev => ({
        ...prev,
        balance: prev.balance + amount,
        totalSms: prev.totalSms + amount
      }));
      alert(`Successfully added ${amount} SMS to your account!`);
    }
    
    setIsProcessing(false);
    setSelectedPlan(null);
    setTopUpAmount('');
  };

  const handleAutoTopUpToggle = () => {
    setSmsData(prev => ({
      ...prev,
      autoTopUp: !prev.autoTopUp
    }));
  };

  const handleLowBalanceAlertToggle = () => {
    setSmsData(prev => ({
      ...prev,
      lowBalanceAlert: !prev.lowBalanceAlert
    }));
  };

  const updateAlertThreshold = (threshold) => {
    setSmsData(prev => ({
      ...prev,
      alertThreshold: threshold
    }));
  };

  const exportSmsHistory = () => {
    // Simulate export functionality
    const dataStr = JSON.stringify(filteredHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sms-history.json';
    link.click();
    alert('SMS history exported successfully!');
  };

  const sendTestSms = () => {
    alert('Test SMS sent successfully! Check your phone for the message.');
  };

  // Calculate progress percentage
  const usagePercentage = (smsData.usedSms / smsData.totalSms) * 100;
  const balancePercentage = (smsData.balance / smsData.totalSms) * 100;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'topup', label: 'Top Up', icon: '💳' },
    { id: 'history', label: 'SMS History', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const getStatusStyle = (status) => {
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold',
      textTransform: 'uppercase'
    };

    const statusStyles = {
      'Delivered': { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' },
      'Failed': { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' },
      'Pending': { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' },
      'Sent': { ...baseStyle, backgroundColor: '#cce7ff', color: '#004085' }
    };

    return statusStyles[status] || baseStyle;
  };

  const getTypeStyle = (type) => {
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold'
    };

    const typeStyles = {
      'Promotional': { ...baseStyle, backgroundColor: '#e3f2fd', color: '#1976d2' },
      'Transactional': { ...baseStyle, backgroundColor: '#e8f5e8', color: '#2e7d32' },
      'Alert': { ...baseStyle, backgroundColor: '#fff3e0', color: '#f57c00' }
    };

    return typeStyles[type] || baseStyle;
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerContentStyle}>
          <h1 style={titleStyle}>SMS Balance & Management</h1>
          <p style={subtitleStyle}>Manage your SMS credits and messaging settings</p>
        </div>
        <div style={headerStatusStyle}>
          <div style={statusBadgeStyle}>
            <span style={{
              ...statusDotStyle,
              backgroundColor: smsData.status === 'active' ? '#28a745' : '#dc3545'
            }}></span>
            {smsData.status === 'active' ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

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

        {/* Main Content */}
        <div style={mainContentStyle}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div style={tabContentStyle}>
              {/* Balance Cards */}
              <div style={cardsGridStyle}>
                <div style={balanceCardStyle}>
                  <div style={balanceHeaderStyle}>
                    <span style={balanceIconStyle}>💬</span>
                    <h3 style={balanceTitleStyle}>Available SMS</h3>
                  </div>
                  <div style={balanceAmountStyle}>{smsData.balance.toLocaleString()}</div>
                  <div style={progressBarContainerStyle}>
                    <div 
                      style={{
                        ...progressBarStyle,
                        width: `${balancePercentage}%`,
                        backgroundColor: smsData.balance < smsData.alertThreshold ? '#dc3545' : '#28a745'
                      }}
                    ></div>
                  </div>
                  <div style={balanceInfoStyle}>
                    <span>Used: {smsData.usedSms.toLocaleString()}</span>
                    <span>Total: {smsData.totalSms.toLocaleString()}</span>
                  </div>
                </div>

                <div style={statCardStyle}>
                  <div style={statHeaderStyle}>
                    <span style={statIconStyle}>📅</span>
                    <h3 style={statTitleStyle}>Validity</h3>
                  </div>
                  <div style={statValueStyle}>{smsData.validity}</div>
                  <div style={statDescriptionStyle}>
                    Plan expires in {Math.ceil((new Date(smsData.validity) - new Date()) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>

                <div style={statCardStyle}>
                  <div style={statHeaderStyle}>
                    <span style={statIconStyle}>💰</span>
                    <h3 style={statTitleStyle}>Total Cost</h3>
                  </div>
                  <div style={statValueStyle}>${usageStats.totalCost.toFixed(2)}</div>
                  <div style={statDescriptionStyle}>
                    Average: ${(usageStats.totalCost / smsHistory.length).toFixed(2)} per SMS
                  </div>
                </div>
              </div>

              {/* Usage Statistics */}
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Usage Statistics</h3>
                <div style={statsGridStyle}>
                  <div style={usageStatStyle}>
                    <div style={usageStatValueStyle}>{usageStats.promotional}</div>
                    <div style={usageStatLabelStyle}>Promotional</div>
                  </div>
                  <div style={usageStatStyle}>
                    <div style={usageStatValueStyle}>{usageStats.transactional}</div>
                    <div style={usageStatLabelStyle}>Transactional</div>
                  </div>
                  <div style={usageStatStyle}>
                    <div style={usageStatValueStyle}>{usageStats.alerts}</div>
                    <div style={usageStatLabelStyle}>Alerts</div>
                  </div>
                  <div style={usageStatStyle}>
                    <div style={usageStatValueStyle}>{usageStats.delivered}</div>
                    <div style={usageStatLabelStyle}>Delivered</div>
                  </div>
                  <div style={usageStatStyle}>
                    <div style={usageStatValueStyle}>{usageStats.failed}</div>
                    <div style={usageStatLabelStyle}>Failed</div>
                  </div>
                  <div style={usageStatStyle}>
                    <div style={usageStatValueStyle}>{smsHistory.length}</div>
                    <div style={usageStatLabelStyle}>Total Sent</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Quick Actions</h3>
                <div style={quickActionsStyle}>
                  <button 
                    style={{...quickActionButtonStyle, ...primaryButtonStyle}}
                    onClick={() => setActiveTab('topup')}
                  >
                    <span style={actionIconStyle}>💳</span>
                    Top Up Balance
                  </button>
                  <button 
                    style={{...quickActionButtonStyle, ...secondaryButtonStyle}}
                    onClick={sendTestSms}
                  >
                    <span style={actionIconStyle}>📱</span>
                    Send Test SMS
                  </button>
                  <button 
                    style={{...quickActionButtonStyle, ...successButtonStyle}}
                    onClick={() => setActiveTab('history')}
                  >
                    <span style={actionIconStyle}>📋</span>
                    View History
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h3 style={sectionTitleStyle}>Recent SMS Activity</h3>
                  <button 
                    style={viewAllButtonStyle}
                    onClick={() => setActiveTab('history')}
                  >
                    View All
                  </button>
                </div>
                <div style={tableContainerStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={tableHeaderStyle}>
                        <th style={tableHeaderCellStyle}>Date</th>
                        <th style={tableHeaderCellStyle}>Type</th>
                        <th style={tableHeaderCellStyle}>Recipient</th>
                        <th style={tableHeaderCellStyle}>Status</th>
                        <th style={tableHeaderCellStyle}>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {smsHistory.slice(0, 5).map(sms => (
                        <tr key={sms.id} style={tableRowStyle}>
                          <td style={tableCellStyle}>
                            <div style={dateTimeStyle}>
                              <div style={dateStyle}>{sms.date}</div>
                              <div style={timeStyle}>{sms.time}</div>
                            </div>
                          </td>
                          <td style={tableCellStyle}>
                            <span style={getTypeStyle(sms.type)}>
                              {sms.type}
                            </span>
                          </td>
                          <td style={tableCellStyle}>{sms.recipient}</td>
                          <td style={tableCellStyle}>
                            <span style={getStatusStyle(sms.status)}>
                              {sms.status}
                            </span>
                          </td>
                          <td style={tableCellStyle}>{sms.cost} credit</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Top Up Tab */}
          {activeTab === 'topup' && (
            <div style={tabContentStyle}>
              <div style={topUpGridStyle}>
                {/* Package Plans */}
                <div style={plansSectionStyle}>
                  <h3 style={sectionTitleStyle}>SMS Packages</h3>
                  <p style={sectionDescriptionStyle}>
                    Choose from our affordable SMS packages
                  </p>
                  
                  <div style={plansGridStyle}>
                    {topUpPlans.map(plan => (
                      <div 
                        key={plan.id}
                        style={{
                          ...planCardStyle,
                          ...(selectedPlan?.id === plan.id ? selectedPlanStyle : {}),
                          ...(plan.popular ? popularPlanStyle : {})
                        }}
                        onClick={() => setSelectedPlan(plan)}
                      >
                        {plan.popular && (
                          <div style={popularBadgeStyle}>Most Popular</div>
                        )}
                        <div style={planHeaderStyle}>
                          <h4 style={planSmsCountStyle}>{plan.smsCount.toLocaleString()} SMS</h4>
                          <div style={planCostStyle}>${plan.cost.toFixed(2)}</div>
                        </div>
                        <div style={planDetailsStyle}>
                          <div style={planDetailItemStyle}>
                            <span style={planDetailLabelStyle}>Validity:</span>
                            <span style={planDetailValueStyle}>{plan.validity}</span>
                          </div>
                          <div style={planDetailItemStyle}>
                            <span style={planDetailLabelStyle}>Cost per SMS:</span>
                            <span style={planDetailValueStyle}>
                              ${(plan.cost / plan.smsCount).toFixed(3)}
                            </span>
                          </div>
                        </div>
                        <button 
                          style={{
                            ...selectPlanButtonStyle,
                            ...(selectedPlan?.id === plan.id ? selectedPlanButtonStyle : {})
                          }}
                        >
                          {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Top Up */}
                <div style={customTopUpSectionStyle}>
                  <h3 style={sectionTitleStyle}>Custom Top Up</h3>
                  <p style={sectionDescriptionStyle}>
                    Or enter a custom amount
                  </p>
                  
                  <div style={customTopUpFormStyle}>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>SMS Quantity</label>
                      <input
                        type="number"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        style={inputStyle}
                        placeholder="Enter number of SMS"
                        min="10"
                      />
                    </div>
                    
                    <div style={costCalculationStyle}>
                      <div style={costRowStyle}>
                        <span style={costLabelStyle}>Unit Price:</span>
                        <span style={costValueStyle}>$0.13 per SMS</span>
                      </div>
                      <div style={costRowStyle}>
                        <span style={costLabelStyle}>Total Cost:</span>
                        <span style={costValueStyle}>
                          ${topUpAmount ? (topUpAmount * 0.13).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div style={paymentSectionStyle}>
                    <h4 style={paymentTitleStyle}>Payment Method</h4>
                    <div style={paymentMethodsStyle}>
                      <label style={paymentMethodLabelStyle}>
                        <input
                          type="radio"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          style={radioStyle}
                        />
                        Credit/Debit Card
                      </label>
                      <label style={paymentMethodLabelStyle}>
                        <input
                          type="radio"
                          value="paypal"
                          checked={paymentMethod === 'paypal'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          style={radioStyle}
                        />
                        PayPal
                      </label>
                      <label style={paymentMethodLabelStyle}>
                        <input
                          type="radio"
                          value="bank"
                          checked={paymentMethod === 'bank'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          style={radioStyle}
                        />
                        Bank Transfer
                      </label>
                    </div>
                  </div>

                  {/* Top Up Button */}
                  <button 
                    style={{
                      ...topUpButtonStyle,
                      ...((!selectedPlan && !topUpAmount) || isProcessing ? disabledButtonStyle : {})
                    }}
                    onClick={() => handleTopUp(selectedPlan)}
                    disabled={(!selectedPlan && !topUpAmount) || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span style={spinnerStyle}></span>
                        Processing...
                      </>
                    ) : (
                      `Top Up ${selectedPlan ? selectedPlan.smsCount.toLocaleString() : topUpAmount || 0} SMS`
                    )}
                  </button>

                  {selectedPlan && (
                    <div style={selectedPlanSummaryStyle}>
                      <h4 style={summaryTitleStyle}>Order Summary</h4>
                      <div style={summaryRowStyle}>
                        <span>Package:</span>
                        <span>{selectedPlan.smsCount.toLocaleString()} SMS</span>
                      </div>
                      <div style={summaryRowStyle}>
                        <span>Cost:</span>
                        <span>${selectedPlan.cost.toFixed(2)}</span>
                      </div>
                      <div style={summaryRowStyle}>
                        <span>Validity:</span>
                        <span>{selectedPlan.validity}</span>
                      </div>
                      <div style={summaryDividerStyle}></div>
                      <div style={{...summaryRowStyle, ...summaryTotalStyle}}>
                        <span>Total:</span>
                        <span>${selectedPlan.cost.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div style={tabContentStyle}>
              <div style={historyHeaderStyle}>
                <h3 style={sectionTitleStyle}>SMS History</h3>
                <div style={historyActionsStyle}>
                  <button 
                    style={{...actionButtonStyle, ...secondaryButtonStyle}}
                    onClick={exportSmsHistory}
                  >
                    Export History
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div style={filtersStyle}>
                <div style={filterGroupStyle}>
                  <label style={filterLabelStyle}>From Date</label>
                  <input
                    type="date"
                    value={filter.dateFrom}
                    onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
                    style={filterInputStyle}
                  />
                </div>
                <div style={filterGroupStyle}>
                  <label style={filterLabelStyle}>To Date</label>
                  <input
                    type="date"
                    value={filter.dateTo}
                    onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))}
                    style={filterInputStyle}
                  />
                </div>
                <div style={filterGroupStyle}>
                  <label style={filterLabelStyle}>Type</label>
                  <select
                    value={filter.type}
                    onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                    style={filterInputStyle}
                  >
                    <option value="all">All Types</option>
                    <option value="promotional">Promotional</option>
                    <option value="transactional">Transactional</option>
                    <option value="alert">Alert</option>
                  </select>
                </div>
                <div style={filterGroupStyle}>
                  <label style={filterLabelStyle}>Status</label>
                  <select
                    value={filter.status}
                    onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                    style={filterInputStyle}
                  >
                    <option value="all">All Status</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div style={filterGroupStyle}>
                  <button 
                    style={resetFiltersButtonStyle}
                    onClick={() => setFilter({ dateFrom: '', dateTo: '', type: 'all', status: 'all' })}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* SMS History Table */}
              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderStyle}>
                      <th style={tableHeaderCellStyle}>Date & Time</th>
                      <th style={tableHeaderCellStyle}>Type</th>
                      <th style={tableHeaderCellStyle}>Recipient</th>
                      <th style={tableHeaderCellStyle}>Message</th>
                      <th style={tableHeaderCellStyle}>Length</th>
                      <th style={tableHeaderCellStyle}>Status</th>
                      <th style={tableHeaderCellStyle}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map(sms => (
                      <tr key={sms.id} style={tableRowStyle}>
                        <td style={tableCellStyle}>
                          <div style={dateTimeStyle}>
                            <div style={dateStyle}>{sms.date}</div>
                            <div style={timeStyle}>{sms.time}</div>
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={getTypeStyle(sms.type)}>
                            {sms.type}
                          </span>
                        </td>
                        <td style={tableCellStyle}>{sms.recipient}</td>
                        <td style={{...tableCellStyle, ...messageCellStyle}}>
                          <div style={messagePreviewStyle} title={sms.message}>
                            {sms.message.length > 50 ? sms.message.substring(0, 50) + '...' : sms.message}
                          </div>
                        </td>
                        <td style={tableCellStyle}>{sms.length} chars</td>
                        <td style={tableCellStyle}>
                          <span style={getStatusStyle(sms.status)}>
                            {sms.status}
                          </span>
                        </td>
                        <td style={tableCellStyle}>{sms.cost} credit</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredHistory.length === 0 && (
                  <div style={noDataStyle}>
                    No SMS records found for the selected filters
                  </div>
                )}
              </div>

              {/* Summary */}
              <div style={summaryCardStyle}>
                <div style={summaryContentStyle}>
                  <div style={summaryItemStyle}>
                    <span style={summaryLabelStyle}>Total Records:</span>
                    <span style={summaryValueStyle}>{filteredHistory.length}</span>
                  </div>
                  <div style={summaryItemStyle}>
                    <span style={summaryLabelStyle}>Total Cost:</span>
                    <span style={summaryValueStyle}>
                      {filteredHistory.reduce((sum, sms) => sum + sms.cost, 0)} credits
                    </span>
                  </div>
                  <div style={summaryItemStyle}>
                    <span style={summaryLabelStyle}>Success Rate:</span>
                    <span style={summaryValueStyle}>
                      {((filteredHistory.filter(sms => sms.status === 'Delivered').length / filteredHistory.length) * 100 || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div style={tabContentStyle}>
              <h3 style={sectionTitleStyle}>SMS Settings</h3>
              
              <div style={settingsGridStyle}>
                {/* Notification Settings */}
                <div style={settingSectionStyle}>
                  <h4 style={settingTitleStyle}>Notification Settings</h4>
                  
                  <div style={toggleItemStyle}>
                    <label style={toggleLabelStyle}>
                      <input
                        type="checkbox"
                        checked={smsData.lowBalanceAlert}
                        onChange={handleLowBalanceAlertToggle}
                        style={checkboxStyle}
                      />
                      Low Balance Alerts
                    </label>
                    <span style={toggleDescriptionStyle}>
                      Receive notifications when SMS balance is low
                    </span>
                  </div>

                  {smsData.lowBalanceAlert && (
                    <div style={thresholdSettingsStyle}>
                      <label style={labelStyle}>Alert Threshold</label>
                      <div style={thresholdButtonsStyle}>
                        {[50, 100, 200, 500].map(threshold => (
                          <button
                            key={threshold}
                            style={{
                              ...thresholdButtonStyle,
                              ...(smsData.alertThreshold === threshold ? activeThresholdButtonStyle : {})
                            }}
                            onClick={() => updateAlertThreshold(threshold)}
                          >
                            {threshold} SMS
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={toggleItemStyle}>
                    <label style={toggleLabelStyle}>
                      <input
                        type="checkbox"
                        checked={smsData.autoTopUp}
                        onChange={handleAutoTopUpToggle}
                        style={checkboxStyle}
                      />
                      Auto Top-Up
                    </label>
                    <span style={toggleDescriptionStyle}>
                      Automatically top up SMS balance when it falls below threshold
                    </span>
                  </div>

                  {smsData.autoTopUp && (
                    <div style={autoTopUpSettingsStyle}>
                      <div style={inputGroupStyle}>
                        <label style={labelStyle}>Top-Up Amount</label>
                        <select
                          value={smsData.topUpAmount}
                          onChange={(e) => setSmsData(prev => ({ ...prev, topUpAmount: parseInt(e.target.value) }))}
                          style={inputStyle}
                        >
                          <option value={100}>100 SMS</option>
                          <option value={500}>500 SMS</option>
                          <option value={1000}>1000 SMS</option>
                          <option value={2500}>2500 SMS</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* SMS Templates */}
                <div style={settingSectionStyle}>
                  <h4 style={settingTitleStyle}>Quick Actions</h4>
                  
                  <div style={quickSettingsStyle}>
                    <button style={settingButtonStyle}>
                      <span style={settingIconStyle}>📝</span>
                      Manage Templates
                    </button>
                    <button style={settingButtonStyle}>
                      <span style={settingIconStyle}>👥</span>
                      Contact Groups
                    </button>
                    <button style={settingButtonStyle}>
                      <span style={settingIconStyle}>⚡</span>
                      SMS API Settings
                    </button>
                    <button style={settingButtonStyle}>
                      <span style={settingIconStyle}>🔔</span>
                      Alert Preferences
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div style={dangerZoneStyle}>
                <h4 style={dangerZoneTitleStyle}>Danger Zone</h4>
                <p style={dangerZoneTextStyle}>
                  These actions are irreversible. Please proceed with caution.
                </p>
                <div style={dangerZoneActionsStyle}>
                  <button style={clearHistoryButtonStyle}>
                    Clear SMS History
                  </button>
                  <button style={disableSmsButtonStyle}>
                    Disable SMS Service
                  </button>
                </div>
              </div>
            </div>
          )}
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

const statusBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  backgroundColor: '#f8f9fa',
  borderRadius: '20px',
  fontSize: '14px',
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
  flexDirection: 'column',
  flex: 1
};

const tabsContainerStyle = {
  display: 'flex',
  backgroundColor: '#fff',
  padding: '0 30px',
  borderBottom: '1px solid #dee2e6'
};

const tabStyle = {
  padding: '15px 25px',
  border: 'none',
  backgroundColor: 'transparent',
  borderBottom: '3px solid transparent',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  color: '#666',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s ease'
};

const activeTabStyle = {
  color: '#007bff',
  borderBottomColor: '#007bff',
  backgroundColor: '#f8f9fa'
};

const tabIconStyle = {
  fontSize: '16px'
};

const mainContentStyle = {
  flex: 1,
  padding: '0',
  backgroundColor: '#fff'
};

const tabContentStyle = {
  padding: '30px',
  animation: 'fadeIn 0.3s ease-in'
};

const cardsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px',
  marginBottom: '30px'
};

const balanceCardStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e9ecef',
  borderRadius: '12px',
  padding: '25px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const balanceHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '15px'
};

const balanceIconStyle = {
  fontSize: '24px'
};

const balanceTitleStyle = {
  margin: '0',
  fontSize: '18px',
  fontWeight: '600',
  color: '#333'
};

const balanceAmountStyle = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#007bff',
  marginBottom: '15px'
};

const progressBarContainerStyle = {
  width: '100%',
  height: '8px',
  backgroundColor: '#e9ecef',
  borderRadius: '4px',
  overflow: 'hidden',
  marginBottom: '10px'
};

const progressBarStyle = {
  height: '100%',
  borderRadius: '4px',
  transition: 'all 0.3s ease'
};

const balanceInfoStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '12px',
  color: '#666'
};

const statCardStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e9ecef',
  borderRadius: '12px',
  padding: '25px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const statHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '15px'
};

const statIconStyle = {
  fontSize: '20px'
};

const statTitleStyle = {
  margin: '0',
  fontSize: '16px',
  fontWeight: '600',
  color: '#333'
};

const statValueStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '5px'
};

const statDescriptionStyle = {
  fontSize: '12px',
  color: '#666'
};

const sectionStyle = {
  marginBottom: '30px'
};

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px'
};

const sectionTitleStyle = {
  margin: '0',
  fontSize: '20px',
  fontWeight: '600',
  color: '#333'
};

const sectionDescriptionStyle = {
  margin: '5px 0 20px 0',
  color: '#666',
  fontSize: '14px'
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '15px'
};

const usageStatStyle = {
  textAlign: 'center',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #e9ecef'
};

const usageStatValueStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#007bff',
  marginBottom: '5px'
};

const usageStatLabelStyle = {
  fontSize: '12px',
  color: '#666',
  textTransform: 'uppercase',
  fontWeight: '500'
};

const quickActionsStyle = {
  display: 'flex',
  gap: '15px',
  flexWrap: 'wrap'
};

const quickActionButtonStyle = {
  padding: '15px 20px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minWidth: '160px',
  transition: 'all 0.2s ease'
};

const actionIconStyle = {
  fontSize: '16px'
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

const viewAllButtonStyle = {
  padding: '8px 16px',
  backgroundColor: 'transparent',
  color: '#007bff',
  border: '1px solid #007bff',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '500'
};

const tableContainerStyle = {
  overflowX: 'auto',
  border: '1px solid #dee2e6',
  borderRadius: '8px'
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

const dateTimeStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
};

const dateStyle = {
  fontWeight: '500',
  fontSize: '12px'
};

const timeStyle = {
  fontSize: '11px',
  color: '#666'
};

const messageCellStyle = {
  maxWidth: '200px'
};

const messagePreviewStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const topUpGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 400px',
  gap: '30px'
};

const plansSectionStyle = {
  padding: '20px'
};

const plansGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px'
};

const planCardStyle = {
  border: '2px solid #e9ecef',
  borderRadius: '12px',
  padding: '20px',
  backgroundColor: '#fff',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative'
};

const selectedPlanStyle = {
  borderColor: '#007bff',
  backgroundColor: '#f0f8ff'
};

const popularPlanStyle = {
  borderColor: '#28a745'
};

const popularBadgeStyle = {
  position: 'absolute',
  top: '-10px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#28a745',
  color: 'white',
  padding: '4px 12px',
  borderRadius: '12px',
  fontSize: '10px',
  fontWeight: 'bold'
};

const planHeaderStyle = {
  textAlign: 'center',
  marginBottom: '15px'
};

const planSmsCountStyle = {
  margin: '0 0 10px 0',
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#333'
};

const planCostStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#007bff'
};

const planDetailsStyle = {
  marginBottom: '15px'
};

const planDetailItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '5px 0',
  fontSize: '12px'
};

const planDetailLabelStyle = {
  color: '#666'
};

const planDetailValueStyle = {
  fontWeight: '500',
  color: '#333'
};

const selectPlanButtonStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#f8f9fa',
  color: '#333',
  border: '1px solid #dee2e6',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s ease'
};

const selectedPlanButtonStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  borderColor: '#007bff'
};

const customTopUpSectionStyle = {
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  border: '1px solid #e9ecef'
};

const customTopUpFormStyle = {
  marginBottom: '20px'
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '15px'
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
  boxSizing: 'border-box'
};

const costCalculationStyle = {
  backgroundColor: '#fff',
  padding: '15px',
  borderRadius: '6px',
  border: '1px solid #e9ecef'
};

const costRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '5px 0'
};

const costLabelStyle = {
  color: '#666',
  fontSize: '14px'
};

const costValueStyle = {
  fontWeight: '600',
  color: '#333',
  fontSize: '14px'
};

const paymentSectionStyle = {
  marginBottom: '20px'
};

const paymentTitleStyle = {
  margin: '0 0 15px 0',
  fontSize: '16px',
  fontWeight: '600',
  color: '#333'
};

const paymentMethodsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const paymentMethodLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  fontSize: '14px'
};

const radioStyle = {
  margin: '0'
};

const topUpButtonStyle = {
  width: '100%',
  padding: '15px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'all 0.2s ease'
};

const disabledButtonStyle = {
  backgroundColor: '#6c757d',
  cursor: 'not-allowed',
  opacity: 0.6
};

const spinnerStyle = {
  width: '16px',
  height: '16px',
  border: '2px solid transparent',
  borderTop: '2px solid white',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const selectedPlanSummaryStyle = {
  marginTop: '20px',
  padding: '15px',
  backgroundColor: '#fff',
  borderRadius: '8px',
  border: '1px solid #e9ecef'
};

const summaryTitleStyle = {
  margin: '0 0 15px 0',
  fontSize: '16px',
  fontWeight: '600',
  color: '#333'
};

const summaryRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '5px 0',
  fontSize: '14px'
};

const summaryDividerStyle = {
  height: '1px',
  backgroundColor: '#e9ecef',
  margin: '10px 0'
};

const summaryTotalStyle = {
  fontWeight: 'bold',
  fontSize: '16px',
  color: '#007bff'
};

const historyHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px'
};

const historyActionsStyle = {
  display: 'flex',
  gap: '10px'
};

const actionButtonStyle = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500'
};

const filtersStyle = {
  display: 'flex',
  gap: '15px',
  alignItems: 'end',
  marginBottom: '20px',
  flexWrap: 'wrap'
};

const filterGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
};

const filterLabelStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#333'
};

const filterInputStyle = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  minWidth: '150px'
};

const resetFiltersButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  height: 'fit-content'
};

const noDataStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#6c757d',
  fontSize: '16px',
  fontStyle: 'italic'
};

const summaryCardStyle = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '20px'
};

const summaryContentStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '20px'
};

const summaryItemStyle = {
  textAlign: 'center'
};

const summaryLabelStyle = {
  display: 'block',
  fontSize: '12px',
  color: '#666',
  marginBottom: '5px'
};

const summaryValueStyle = {
  display: 'block',
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333'
};

const settingsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: '30px'
};

const settingSectionStyle = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e9ecef'
};

const settingTitleStyle = {
  margin: '0 0 20px 0',
  fontSize: '18px',
  fontWeight: '600',
  color: '#333'
};

const toggleItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  padding: '15px',
  border: '1px solid #e9ecef',
  borderRadius: '6px',
  backgroundColor: '#fff',
  marginBottom: '15px'
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

const thresholdSettingsStyle = {
  marginLeft: '28px',
  marginTop: '10px'
};

const thresholdButtonsStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginTop: '8px'
};

const thresholdButtonStyle = {
  padding: '6px 12px',
  backgroundColor: '#f8f9fa',
  color: '#333',
  border: '1px solid #dee2e6',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  transition: 'all 0.2s ease'
};

const activeThresholdButtonStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  borderColor: '#007bff'
};

const autoTopUpSettingsStyle = {
  marginLeft: '28px',
  marginTop: '10px'
};

const quickSettingsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '15px'
};

const settingButtonStyle = {
  padding: '15px',
  backgroundColor: '#fff',
  color: '#333',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s ease'
};

const settingIconStyle = {
  fontSize: '20px'
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
  margin: '0 0 10px 0',
  fontSize: '18px',
  fontWeight: '600'
};

const dangerZoneTextStyle = {
  color: '#666',
  margin: '0 0 15px 0',
  fontSize: '14px'
};

const dangerZoneActionsStyle = {
  display: 'flex',
  gap: '15px',
  flexWrap: 'wrap'
};

const clearHistoryButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#ffc107',
  color: '#212529',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500'
};

const disableSmsButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500'
};

export default SmsBalance;