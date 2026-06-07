import React, { useState } from 'react';

const SMSSettings = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [smsProvider, setSmsProvider] = useState('twilio');
  const [autoSmsEnabled, setAutoSmsEnabled] = useState(true);

  // SMS Provider Configuration
  const [providerConfig, setProviderConfig] = useState({
    twilio: {
      accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      authToken: '********************************',
      phoneNumber: '+1234567890',
      status: 'connected'
    },
    messagebird: {
      apiKey: '********************************',
      originator: 'MyStore',
      status: 'not-connected'
    }
  });

  // SMS Templates
  const [smsTemplates, setSmsTemplates] = useState([
    {
      id: 1,
      name: 'Order Confirmation',
      type: 'order_confirmation',
      enabled: true,
      template: 'Hi {customer_name}, your order #{order_id} has been confirmed. Total: {order_total}. Thank you for shopping with us!',
      variables: ['customer_name', 'order_id', 'order_total'],
      trigger: 'after_payment'
    },
    {
      id: 2,
      name: 'Shipping Notification',
      type: 'shipping_notification',
      enabled: true,
      template: 'Hi {customer_name}, your order #{order_id} has been shipped. Tracking: {tracking_number}. Expected delivery: {delivery_date}',
      variables: ['customer_name', 'order_id', 'tracking_number', 'delivery_date'],
      trigger: 'order_shipped'
    },
    {
      id: 3,
      name: 'Delivery Notification',
      type: 'delivery_notification',
      enabled: false,
      template: 'Hi {customer_name}, your order #{order_id} is out for delivery today. Our driver will arrive between {delivery_time}.',
      variables: ['customer_name', 'order_id', 'delivery_time'],
      trigger: 'out_for_delivery'
    },
    {
      id: 4,
      name: 'Pickup Ready',
      type: 'pickup_ready',
      enabled: true,
      template: 'Hi {customer_name}, your order #{order_id} is ready for pickup at {store_location}. Please bring your ID.',
      variables: ['customer_name', 'order_id', 'store_location'],
      trigger: 'ready_for_pickup'
    },
    {
      id: 5,
      name: 'Payment Reminder',
      type: 'payment_reminder',
      enabled: true,
      template: 'Hi {customer_name}, your invoice #{invoice_id} for {amount} is due on {due_date}. Please make payment to avoid late fees.',
      variables: ['customer_name', 'invoice_id', 'amount', 'due_date'],
      trigger: 'before_due_date'
    },
    {
      id: 6,
      name: 'Low Stock Alert',
      type: 'low_stock_alert',
      enabled: false,
      template: 'Alert: {product_name} is running low. Current stock: {current_stock}. Reorder level: {reorder_level}',
      variables: ['product_name', 'current_stock', 'reorder_level'],
      trigger: 'low_stock',
      recipient: 'staff'
    }
  ]);

  // SMS History
  const [smsHistory, setSmsHistory] = useState([
    {
      id: 1,
      recipient: '+1234567890',
      message: 'Hi John, your order #1001 has been confirmed. Total: $150.00. Thank you for shopping with us!',
      status: 'delivered',
      type: 'order_confirmation',
      cost: 0.05,
      timestamp: '2024-01-15 14:30:25',
      direction: 'outbound'
    },
    {
      id: 2,
      recipient: '+1234567891',
      message: 'Hi Sarah, your order #1002 is ready for pickup at Main Store. Please bring your ID.',
      status: 'delivered',
      type: 'pickup_ready',
      cost: 0.05,
      timestamp: '2024-01-15 13:15:42',
      direction: 'outbound'
    },
    {
      id: 3,
      recipient: '+1234567892',
      message: 'Alert: iPhone 14 Pro is running low. Current stock: 8. Reorder level: 15',
      status: 'delivered',
      type: 'low_stock_alert',
      cost: 0.05,
      timestamp: '2024-01-15 11:20:18',
      direction: 'outbound'
    },
    {
      id: 4,
      recipient: '+1234567893',
      message: 'Hi Mike, your invoice #INV-001 for $89.99 is due on 2024-01-20. Please make payment to avoid late fees.',
      status: 'failed',
      type: 'payment_reminder',
      cost: 0.00,
      timestamp: '2024-01-15 10:05:33',
      direction: 'outbound'
    },
    {
      id: 5,
      recipient: 'System',
      message: 'YES to confirm pickup or NO to reschedule',
      status: 'delivered',
      type: 'inbound',
      cost: 0.00,
      timestamp: '2024-01-15 09:45:12',
      direction: 'inbound'
    }
  ]);

  // Auto-SMS Rules
  const [autoSmsRules, setAutoSmsRules] = useState([
    {
      id: 1,
      name: 'New Order Notification',
      enabled: true,
      trigger: 'order_placed',
      template: 'order_confirmation',
      recipients: ['customer'],
      delay: 'immediately'
    },
    {
      id: 2,
      name: 'Pickup Ready Alert',
      enabled: true,
      trigger: 'order_ready',
      template: 'pickup_ready',
      recipients: ['customer'],
      delay: 'immediately'
    },
    {
      id: 3,
      name: 'Payment Reminder',
      enabled: true,
      trigger: 'invoice_due',
      template: 'payment_reminder',
      recipients: ['customer'],
      delay: '1_day_before'
    },
    {
      id: 4,
      name: 'Low Stock Warning',
      enabled: false,
      trigger: 'low_stock',
      template: 'low_stock_alert',
      recipients: ['manager', 'inventory_staff'],
      delay: 'immediately'
    },
    {
      id: 5,
      name: 'Delivery Notification',
      enabled: false,
      trigger: 'out_for_delivery',
      template: 'delivery_notification',
      recipients: ['customer'],
      delay: 'morning_of_delivery'
    }
  ]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const styles = {
      delivered: 'success',
      sent: 'primary',
      failed: 'danger',
      pending: 'warning'
    };
    return `badge bg-${styles[status]}`;
  };

  const getDirectionBadge = (direction) => {
    return direction === 'outbound' ? 'badge bg-primary' : 'badge bg-info';
  };

  const getTypeBadge = (type) => {
    const styles = {
      order_confirmation: 'success',
      pickup_ready: 'primary',
      payment_reminder: 'warning',
      low_stock_alert: 'danger',
      shipping_notification: 'info',
      inbound: 'secondary'
    };
    return `badge bg-${styles[type]}`;
  };

  const calculateMonthlyCost = () => {
    return smsHistory.reduce((total, sms) => total + sms.cost, 0);
  };

  const calculateSuccessRate = () => {
    const delivered = smsHistory.filter(sms => sms.status === 'delivered').length;
    return (delivered / smsHistory.length) * 100;
  };

  const SMSOverview = () => (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">SMS Overview & Analytics</h5>
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-3 text-center">
                <div className="border rounded p-3">
                  <h3 className="text-primary">{smsHistory.length}</h3>
                  <small className="text-muted">Total Messages Sent</small>
                </div>
              </div>
              <div className="col-md-3 text-center">
                <div className="border rounded p-3">
                  <h3 className="text-success">{calculateSuccessRate().toFixed(1)}%</h3>
                  <small className="text-muted">Delivery Success Rate</small>
                </div>
              </div>
              <div className="col-md-3 text-center">
                <div className="border rounded p-3">
                  <h3 className="text-warning">{formatCurrency(calculateMonthlyCost())}</h3>
                  <small className="text-muted">Monthly Cost</small>
                </div>
              </div>
              <div className="col-md-3 text-center">
                <div className="border rounded p-3">
                  <h3 className="text-info">{smsTemplates.filter(t => t.enabled).length}</h3>
                  <small className="text-muted">Active Templates</small>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h6 className="card-title mb-0">Quick Actions</h6>
                  </div>
                  <div className="card-body">
                    <div className="d-grid gap-2">
                      <button className="btn btn-primary">
                        <i className="fas fa-paper-plane me-2"></i>Send Test SMS
                      </button>
                      <button className="btn btn-outline-primary">
                        <i className="fas fa-sync-alt me-2"></i>Check Provider Status
                      </button>
                      <button className="btn btn-outline-success">
                        <i className="fas fa-download me-2"></i>Export SMS History
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h6 className="card-title mb-0">Provider Status</h6>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span>Twilio</span>
                      <span className="badge bg-success">Connected</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span>MessageBird</span>
                      <span className="badge bg-secondary">Not Connected</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Balance</span>
                      <span className="fw-bold text-primary">$45.75</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TemplateManagement = () => (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">SMS Templates</h5>
              <button className="btn btn-primary">
                <i className="fas fa-plus me-1"></i> New Template
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '40px' }}>Status</th>
                    <th>Template Name</th>
                    <th>Trigger</th>
                    <th>Message Preview</th>
                    <th>Variables</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {smsTemplates.map((template) => (
                    <tr key={template.id}>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={template.enabled}
                            onChange={() => {
                              const updatedTemplates = smsTemplates.map(t =>
                                t.id === template.id ? { ...t, enabled: !t.enabled } : t
                              );
                              setSmsTemplates(updatedTemplates);
                            }}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold">{template.name}</div>
                        <small className="text-muted">{template.type.replace('_', ' ')}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {template.trigger.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="text-muted small" style={{ maxWidth: '300px' }}>
                          {template.template.length > 80 
                            ? `${template.template.substring(0, 80)}...` 
                            : template.template
                          }
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {template.variables.map(variable => (
                            <span key={variable} className="badge bg-info">
                              {variable}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary" title="Edit Template">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="btn btn-outline-success" title="Test Template">
                            <i className="fas fa-paper-plane"></i>
                          </button>
                          <button className="btn btn-outline-info" title="Preview">
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className="btn btn-outline-danger" title="Delete">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SMSHistory = () => (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">SMS History</h5>
              <div className="d-flex gap-2">
                <input 
                  type="date" 
                  className="form-control form-control-sm"
                  style={{ width: '150px' }}
                />
                <button className="btn btn-outline-primary btn-sm">
                  <i className="fas fa-filter me-1"></i> Filter
                </button>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date & Time</th>
                    <th>Recipient</th>
                    <th>Message</th>
                    <th>Type</th>
                    <th>Direction</th>
                    <th>Status</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {smsHistory.map((sms) => (
                    <tr key={sms.id}>
                      <td>
                        <small className="text-muted">{formatDate(sms.timestamp)}</small>
                      </td>
                      <td className="fw-medium">{sms.recipient}</td>
                      <td>
                        <div style={{ maxWidth: '250px' }}>
                          {sms.message.length > 60 
                            ? `${sms.message.substring(0, 60)}...` 
                            : sms.message
                          }
                          <br />
                          <small className="text-muted">{sms.message.length} chars</small>
                        </div>
                      </td>
                      <td>
                        <span className={getTypeBadge(sms.type)}>
                          {sms.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={getDirectionBadge(sms.direction)}>
                          {sms.direction}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadge(sms.status)}>
                          {sms.status}
                        </span>
                      </td>
                      <td className="text-end">
                        {formatCurrency(sms.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Showing {smsHistory.length} messages
              </small>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className="page-item disabled">
                    <a className="page-link" href="#">Previous</a>
                  </li>
                  <li className="page-item active">
                    <a className="page-link" href="#">1</a>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#">2</a>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#">Next</a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ProviderSettings = () => (
    <div className="row">
      <div className="col-lg-6">
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">SMS Provider Configuration</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">SMS Provider</label>
              <select 
                className="form-select"
                value={smsProvider}
                onChange={(e) => setSmsProvider(e.target.value)}
              >
                <option value="twilio">Twilio</option>
                <option value="messagebird">MessageBird</option>
                <option value="nexmo">Vonage (Nexmo)</option>
                <option value="plivo">Plivo</option>
              </select>
            </div>

            {smsProvider === 'twilio' && (
              <>
                <div className="mb-3">
                  <label className="form-label">Account SID</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={providerConfig.twilio.accountSid}
                    onChange={(e) => setProviderConfig({
                      ...providerConfig,
                      twilio: { ...providerConfig.twilio, accountSid: e.target.value }
                    })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Auth Token</label>
                  <input 
                    type="password" 
                    className="form-control"
                    value={providerConfig.twilio.authToken}
                    onChange={(e) => setProviderConfig({
                      ...providerConfig,
                      twilio: { ...providerConfig.twilio, authToken: e.target.value }
                    })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={providerConfig.twilio.phoneNumber}
                    onChange={(e) => setProviderConfig({
                      ...providerConfig,
                      twilio: { ...providerConfig.twilio, phoneNumber: e.target.value }
                    })}
                  />
                </div>
              </>
            )}

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                checked={smsEnabled}
                onChange={() => setSmsEnabled(!smsEnabled)}
              />
              <label className="form-check-label">Enable SMS Notifications</label>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                checked={autoSmsEnabled}
                onChange={() => setAutoSmsEnabled(!autoSmsEnabled)}
              />
              <label className="form-check-label">Enable Auto-SMS</label>
            </div>

            <button className="btn btn-primary">
              <i className="fas fa-save me-1"></i> Save Settings
            </button>
            <button className="btn btn-outline-secondary ms-2">
              <i className="fas fa-test me-1"></i> Test Connection
            </button>
          </div>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">Auto-SMS Rules</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Rule Name</th>
                    <th>Trigger</th>
                    <th>Delay</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {autoSmsRules.map((rule) => (
                    <tr key={rule.id}>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => {
                              const updatedRules = autoSmsRules.map(r =>
                                r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                              );
                              setAutoSmsRules(updatedRules);
                            }}
                          />
                        </div>
                      </td>
                      <td className="fw-medium">{rule.name}</td>
                      <td>
                        <small className="text-muted">{rule.trigger.replace('_', ' ')}</small>
                      </td>
                      <td>
                        <small className="text-muted">{rule.delay.replace('_', ' ')}</small>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary">
                          <i className="fas fa-edit"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card mt-4">
          <div className="card-header">
            <h5 className="card-title mb-0">Quick SMS</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-control" placeholder="+1234567890" />
            </div>
            <div className="mb-3">
              <label className="form-label">Message</label>
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder="Type your message here..."
                maxLength="160"
              ></textarea>
              <small className="text-muted">160 characters maximum</small>
            </div>
            <button className="btn btn-success w-100">
              <i className="fas fa-paper-plane me-1"></i> Send SMS
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h2 className="text-primary">
                <i className="fas fa-sms me-2"></i>
                SMS Settings & Notifications
              </h2>
              <p className="text-muted mb-0">Configure SMS providers, templates, and automated notifications</p>
            </div>
            <div className="d-flex gap-2 mt-2 mt-md-0">
              <button className="btn btn-outline-primary">
                <i className="fas fa-sync-alt me-1"></i> Refresh
              </button>
              <button className="btn btn-primary">
                <i className="fas fa-download me-1"></i> Export Logs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body py-2">
              <ul className="nav nav-pills">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <i className="fas fa-chart-bar me-1"></i>
                    Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'templates' ? 'active' : ''}`}
                    onClick={() => setActiveTab('templates')}
                  >
                    <i className="fas fa-file-alt me-1"></i>
                    Templates
                    <span className="badge bg-primary ms-1">{smsTemplates.length}</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                  >
                    <i className="fas fa-history me-1"></i>
                    History
                    <span className="badge bg-info ms-1">{smsHistory.length}</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                  >
                    <i className="fas fa-cog me-1"></i>
                    Settings
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        <div className="col-12">
          {activeTab === 'overview' && <SMSOverview />}
          {activeTab === 'templates' && <TemplateManagement />}
          {activeTab === 'history' && <SMSHistory />}
          {activeTab === 'settings' && <ProviderSettings />}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">SMS Quick Actions</h6>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-outline-primary">
                  <i className="fas fa-paper-plane me-1"></i> Send Bulk SMS
                </button>
                <button className="btn btn-outline-success">
                  <i className="fas fa-file-import me-1"></i> Import Contacts
                </button>
                <button className="btn btn-outline-warning">
                  <i className="fas fa-sliders me-1"></i> Configure Webhooks
                </button>
                <button className="btn btn-outline-info">
                  <i className="fas fa-chart-line me-1"></i> Analytics Report
                </button>
                <button className="btn btn-outline-danger">
                  <i className="fas fa-trash me-1"></i> Clear History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSSettings;