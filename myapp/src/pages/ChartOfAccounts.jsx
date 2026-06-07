import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const initialFormData = {
  accountId: '',
  code: '',
  accountType: 'Debtors, Buyers, Customers, Clients',
  accountTitle: '',
  urduTitle: '',
  ledgerNo: '',
  discountPercent: '',
  creditLimit: '',
  creditDays: '0',
  priceList: 'Whole Sale',
  office: 'Home',
  contactPerson: '',
  phoneNo: '',
  cellNo: '',
  address: '',
  area: '',
  city: '',
  email: '',
  openingBalance: '0',
  balanceDate: '29-Mar-22',
  balanceType: 'Receivable',
  isActive: true,
};

function ChartOfAccounts() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [accountsList, setAccountsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAccounts = async (keepSelection = true) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/accounts');
      setAccountsList(response.data);
      if (!keepSelection) {
        setSelectedAccountId(null);
        setFormData(initialFormData);
      }
    } catch (err) {
      setError('Failed to fetch accounts.');
      setAccountsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts(false);
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      const account = accountsList.find(
        (a) => a._id === selectedAccountId || a.accountId === selectedAccountId
      );
      if (account) {
        setFormData({
          accountId: account.accountId || account._id || '',
          code: account.code || '',
          accountTitle: account.accountTitle || account.name || '',
          urduTitle: account.urduTitle || '',
          accountType: account.accountType || 'Debtors, Buyers, Customers, Clients',
          ledgerNo: account.ledgerNo || '',
          discountPercent: account.discountPercent !== undefined ? account.discountPercent : '',
          creditLimit: account.creditLimit !== undefined ? account.creditLimit : '',
          creditDays: account.creditDays !== undefined ? String(account.creditDays) : '0',
          priceList: account.priceList || 'Whole Sale',
          office: account.office || 'Home',
          contactPerson: account.contactPerson || '',
          phoneNo: account.phoneNo || '',
          cellNo: account.cellNo || '',
          address: account.address || '',
          area: account.area || '',
          city: account.city || '',
          email: account.email || '',
          openingBalance:
            account.openingBalance !== undefined ? String(account.openingBalance) : '0',
          balanceDate: account.balanceDate || '29-Mar-22',
          balanceType: account.balanceType || 'Receivable',
          isActive: account.isActive !== undefined ? account.isActive : true,
        });
      }
    } else {
      setFormData(initialFormData);
    }
  }, [selectedAccountId, accountsList]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleRadioChange = (e) => {
    setFormData({
      ...formData,
      balanceType: e.target.value,
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        discountPercent: Number(formData.discountPercent) || 0,
        creditLimit: Number(formData.creditLimit) || 0,
        creditDays: Number(formData.creditDays) || 0,
        openingBalance: Number(formData.openingBalance) || 0,
        isActive: formData.isActive === true || formData.isActive === 'true',
      };
      await api.post('/accounts', payload);
      alert('Account saved successfully!');
      await fetchAccounts(false);
      setFormData(initialFormData);
      setSelectedAccountId(null);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to save account. Check console.'
      );
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAccountId) {
      alert('Select an account first!');
      return;
    }
    if (updating) return;
    setUpdating(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        discountPercent: Number(formData.discountPercent) || 0,
        creditLimit: Number(formData.creditLimit) || 0,
        creditDays: Number(formData.creditDays) || 0,
        openingBalance: Number(formData.openingBalance) || 0,
        isActive: formData.isActive === true || formData.isActive === 'true',
      };
      await api.put(`/accounts/${selectedAccountId}`, payload);
      alert('Account updated successfully!');
      await fetchAccounts();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to update account. Check console.'
      );
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAccountId) {
      alert('Select an account first!');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/accounts/${selectedAccountId}`);
      alert('Account deleted successfully!');
      await fetchAccounts();
      setFormData(initialFormData);
      setSelectedAccountId(null);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to delete account. Check console.'
      );
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    setFormData(initialFormData);
    setSelectedAccountId(null);
  };

  const handleNext = () => {
    if (accountsList.length === 0) return;
    const currentIndex = accountsList.findIndex(
      (a) => a._id === selectedAccountId || a.accountId === selectedAccountId
    );
    if (currentIndex < accountsList.length - 1) {
      setSelectedAccountId(accountsList[currentIndex + 1]._id || accountsList[currentIndex + 1].accountId);
    } else {
      setSelectedAccountId(accountsList[0]._id || accountsList[0].accountId);
    }
  };

  const handlePrev = () => {
    if (accountsList.length === 0) return;
    const currentIndex = accountsList.findIndex(
      (a) => a._id === selectedAccountId || a.accountId === selectedAccountId
    );
    if (currentIndex > 0) {
      setSelectedAccountId(accountsList[currentIndex - 1]._id || accountsList[currentIndex - 1].accountId);
    } else {
      const last = accountsList[accountsList.length - 1];
      setSelectedAccountId(last._id || last.accountId);
    }
  };

  const buttonStyle = {
    padding: '6px 15px',
    border: '1px solid #999',
    backgroundColor: '#f0f0f0',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '1px 1px 2px rgba(0,0,0,0.2)',
    flexShrink: 0,
  };

  return (
    <div
      style={{
        backgroundColor: '#f0f0f0',
        minHeight: '100vh',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          backgroundColor: '#4a4a4a',
          color: '#ffffff',
          padding: '15px 30px',
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center',
          borderBottom: '3px solid #333',
          flexShrink: 0,
        }}
      >
        Define Chart of Accounts
      </div>

      <div
        className="container-fluid p-3"
        style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div className="row g-2" style={{ flexGrow: 1 }}>
          {/* Left Section - Form */}
          <div className="col-lg-6">
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #999',
                borderRadius: '5px',
                padding: '15px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Basic Information */}
              <fieldset
                style={{
                  border: '2px solid #999',
                  borderRadius: '5px',
                  padding: '10px',
                  marginBottom: '15px',
                }}
              >
                <legend
                  style={{
                    width: 'auto',
                    padding: '0 10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '0',
                  }}
                >
                  Basic Information
                </legend>
                <div className="row mb-2 align-items-center">
                  <div className="col-4">
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Account ID</label>
                  </div>
                  <div className="col-8">
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <input
                        type="text"
                        name="accountId"
                        value={formData.accountId}
                        onChange={handleInputChange}
                        style={{ width: '80px', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                        disabled={saving || updating || deleting}
                      />
                      <button
                        style={{ ...buttonStyle, padding: '4px 12px', boxShadow: 'none' }}
                        onClick={handlePrev}
                        disabled={saving || updating || deleting}
                      >
                        {'<<'}
                      </button>
                      <button
                        style={{ ...buttonStyle, padding: '4px 12px', boxShadow: 'none' }}
                        onClick={handleNext}
                        disabled={saving || updating || deleting}
                      >
                        {'>>'}
                      </button>
                      <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Code</label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        style={{ width: '80px', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                        disabled={saving || updating || deleting}
                      />
                    </div>
                  </div>
                </div>
                <div className="row mb-2 align-items-center">
                  <div className="col-4">
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>A/C Type</label>
                  </div>
                  <div className="col-8">
                    <select
                      name="accountType"
                      value={formData.accountType}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                      disabled={saving || updating || deleting}
                    >
                      <option>Debtors, Buyers, Customers, Clients</option>
                      <option>Creditors, Suppliers, Vendors</option>
                      <option>Assets</option>
                      <option>Intangible Assets</option>
                      <option>Cash & Bank</option>
                      <option>Capital / Share Holders</option>
                      <option>Wages, Salaries and Benefits</option>
                      <option>Expenses</option>
                      <option>Liabilities</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Account Info */}
              <fieldset
                style={{
                  border: '2px solid #999',
                  borderRadius: '5px',
                  padding: '10px',
                  flexGrow: 1,
                  overflowY: 'auto',
                }}
              >
                <legend
                  style={{
                    width: 'auto',
                    padding: '0 10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '0',
                  }}
                >
                  Account Info.
                </legend>
                {[
                  { label: 'Account Title', name: 'accountTitle', type: 'text' },
                  { label: 'Urdu Title', name: 'urduTitle', type: 'text' },
                  { label: 'Price List', name: 'priceList', type: 'select', options: ['Whole Sale', 'Retail'] },
                  { label: 'Contact Person', name: 'contactPerson', type: 'text' },
                  { label: 'Phone #', name: 'phoneNo', type: 'text' },
                  { label: 'Cell #', name: 'cellNo', type: 'text' },
                  { label: 'Address', name: 'address', type: 'text' },
                  { label: 'E-mail Address', name: 'email', type: 'email' },
                ].map((field, idx) => (
                  <div className="row mb-1 align-items-center" key={idx}>
                    <div className="col-4">
                      <label style={{ fontSize: '13px', fontWeight: 'bold' }}>{field.label}</label>
                    </div>
                    <div className="col-8">
                      {field.type === 'select' ? (
                        <select
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleInputChange}
                          style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                          disabled={saving || updating || deleting}
                        >
                          {field.options.map((opt) => (
                            <option key={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleInputChange}
                          style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                          disabled={saving || updating || deleting}
                        />
                      )}
                    </div>
                  </div>
                ))}

                {/* Additional fields */}
                <div className="row mb-1 align-items-center">
                  <div className="col-3">
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Ledger #</label>
                  </div>
                  <div className="col-3">
                    <input
                      type="text"
                      name="ledgerNo"
                      value={formData.ledgerNo}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                      disabled={saving || updating || deleting}
                    />
                  </div>
                  <div className="col-3">
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Credit Limit</label>
                  </div>
                  <div className="col-3">
                    <input
                      type="text"
                      name="creditLimit"
                      value={formData.creditLimit}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                      disabled={saving || updating || deleting}
                    />
                  </div>
                </div>

                                {/* Discount % and Credit Days */}
                                <div className="row mb-1 align-items-center">
                                    <div className="col-3">
                                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Discount %</label>
                                    </div>
                                    <div className="col-3">
                                        <input
                                            type="text"
                                            name="discountPercent"
                                            value={formData.discountPercent}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                                        />
                                    </div>
                                    <div className="col-3">
                                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Credit Days</label>
                                    </div>
                                    <div className="col-3">
                                        <input
                                            type="text"
                                            name="creditDays"
                                            value={formData.creditDays}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>


                                {/* Office */}
                                <div className="row mb-1 align-items-center">
                                    <div className="col-4">
                                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Office</label>
                                    </div>
                                    <div className="col-8">
                                        <label style={{ fontSize: '13px' }}>
                                            <input type="checkbox" checked={formData.office === 'Home'} readOnly /> Home
                                        </label>
                                    </div>
                                </div>

                                {/* Contact Person */}
                                <div className="row mb-1 align-items-center">
                                    <div className="col-4">
                                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Cont.Person</label>
                                    </div>
                                    <div className="col-8">
                                        <input
                                            type="text"
                                            name="contactPerson"
                                            value={formData.contactPerson}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>

                                {/* Phone # */}
                                <div className="row mb-1 align-items-center">
                                    <div className="col-4">
                                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Phone #</label>
                                    </div>
                                    <div className="col-8">
                                        <input
                                            type="text"
                                            name="phoneNo"
                                            value={formData.phoneNo}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>

                                {/* Cell # */}
                                <div className="row mb-1 align-items-center">
                                    <div className="col-4">
                                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Cell #</label>
                                    </div>
                                    <div className="col-8">
                                        <input
                                            type="text"
                                            name="cellNo"
                                            value={formData.cellNo}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="row mb-1 align-items-center">
                                    <div className="col-4">
                                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Address</label>
                                    </div>
                                    <div className="col-8">
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>

                                {/* Area / City */}
                                <div className="row mb-1 align-items-center">
                                    <div className="col-4">
                                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Area / City</label>
                                    </div>
                                    <div className="col-4">
                                        <select
                                            name="area"
                                            value={formData.area}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                                        >
                                            <option value="">Select Area</option>
                                        </select>
                                    </div>
                                    <div className="col-4">
                                        <select
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                                        >
                                            <option value="">Select City</option>
                                        </select>
                                    </div>
                                </div>

                                {/* E-mail Address */}
                                <div className="row align-items-center">
                                    <div className="col-4">
                                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>E-mail Address</label>
                                    </div>
                                    <div className="col-8">
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </div>

                    {/* Right Section - List and Commands (50% Width) */}
                    <div className="col-lg-6">
                        <div style={{
                            backgroundColor: '#ffffff',
                            border: '2px solid #999',
                            borderRadius: '5px',
                            padding: '15px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            
                            {/* List Section (Table) - FIXED HEIGHT ADDED HERE */}
                            <fieldset style={{
                                border: '2px solid #999',
                                borderRadius: '5px',
                                padding: '10px',
                                // Using flex-grow: 1 to occupy available space above commands
                                flexGrow: 1, 
                                display: 'flex',
                                flexDirection: 'column',
                                marginBottom: '15px',
                               
                                maxHeight: '70vh' // Example: 70% of the viewport height, or a fixed pixel value
                            }}>
                                <legend style={{
                                    width: 'auto',
                                    padding: '0 10px',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}>
                                    List
                                </legend>

                                {/* Scrollable Container */}
                                <div style={{ 
                                    overflow: 'auto', // Enable both horizontal (side) and vertical (up/down) scrolling
                                    flexGrow: 1 
                                }}>
                                    <table style={{
                                        width: '100%',
                                        minWidth: '700px', // Ensures horizontal scroll is available
                                        borderCollapse: 'collapse',
                                        fontSize: '13px'
                                    }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#e0e0e0', position: 'sticky', top: 0, zIndex: 1 }}> {/* Sticky header for better viewing */}
                                                <th style={{ border: '1px solid #999', padding: '5px', minWidth: '30px' }}>Sr.</th>
                                                <th style={{ border: '1px solid #999', padding: '5px', minWidth: '80px' }}>ID</th>
                                                <th style={{ border: '1px solid #999', padding: '5px', minWidth: '60px' }}>Code</th>
                                                <th style={{ border: '1px solid #999', padding: '5px', minWidth: '150px' }}>Title</th>
                                                <th style={{ border: '1px solid #999', padding: '5px', minWidth: '100px' }}>Type</th>
                                                <th style={{ border: '1px solid #999', padding: '5px', minWidth: '200px' }}>Address</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {accountsList.map((account, index) => {
                                                const accountId = account.accountId || account._id;
                                                return (
                                                    <tr
                                                        key={accountId || index}
                                                        onClick={() => {
                                                            setSelectedAccountId(accountId);
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                accountId: accountId,
                                                                code: account.code,
                                                                accountTitle: account.accountTitle || account.name,
                                                                urduTitle: account.urduTitle || '',
                                                                accountType: account.accountType || 'Debtors, Buyers, Customers, Clients',
                                                                ledgerNo: account.ledgerNo || '',
                                                                discountPercent: account.discountPercent || '',
                                                                creditLimit: account.creditLimit || '',
                                                                creditDays: account.creditDays || '0',
                                                                priceList: account.priceList || 'Whole Sale',
                                                                office: account.office || 'Home',
                                                                contactPerson: account.contactPerson || '',
                                                                phoneNo: account.phoneNo || '',
                                                                cellNo: account.cellNo || '',
                                                                address: account.address || '',
                                                                area: account.area || '',
                                                                city: account.city || '',
                                                                email: account.email || '',
                                                                openingBalance: account.openingBalance || '0',
                                                                balanceDate: account.balanceDate || '29-Mar-22',
                                                                balanceType: account.balanceType || 'Receivable',
                                                                isActive: account.isActive !== undefined ? account.isActive : true
                                                            }));
                                                        }}
                                                        style={{
                                                            backgroundColor: selectedAccountId === accountId ? '#e8e8e8' : 'transparent',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                    <td style={{ border: '1px solid #999', padding: '5px', textAlign: 'center' }}>
                                                        {index + 1}
                                                    </td>
                                                    <td style={{ border: '1px solid #999', padding: '5px', textAlign: 'center' }}>
                                                        {account.accountId || account._id}
                                                    </td>
                                                    <td style={{ border: '1px solid #999', padding: '5px', textAlign: 'center' }}>
                                                        {account.code}
                                                    </td>
                                                    <td style={{ border: '1px solid #999', padding: '5px' }}>
                                                        {account.accountTitle || account.name}
                                                    </td>
                                                    <td style={{ border: '1px solid #999', padding: '5px' }}>
                                                        {account.accountType}
                                                    </td>
                                                    <td style={{ border: '1px solid #999', padding: '5px' }}>
                                                        {account.address}
                                                    </td>
                                                </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </fieldset>

                            {/* Commands Section (Relocated below the List) */}
                            <fieldset style={{
                                border: '2px solid #999',
                                borderRadius: '5px',
                                padding: '10px',
                                flexShrink: 0 
                            }}>
                                <legend style={{
                                    width: 'auto',
                                    padding: '0 10px',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}>
                                    Commands
                                </legend>

                                {/* Row 1: Opening Bal, Receivable Radio */}
                                <div className="row align-items-center g-2 mb-2">
                                    <div className="col-md-3">
                                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Opening Bal.</label>
                                    </div>
                                    <div className="col-md-3">
                                        <input
                                            type="number"
                                            name="openingBalance"
                                            value={formData.openingBalance}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label style={{ fontSize: '13px' }}>
                                            <input
                                                type="radio"
                                                name="balanceType"
                                                value="Receivable"
                                                checked={formData.balanceType === 'Receivable'}
                                                onChange={handleRadioChange}
                                            /> Receivable
                                        </label>
                                    </div>
                                    <div className="col-md-3">
                                        <button onClick={handleRefresh} style={buttonStyle}>
                                            <span>🔄</span> Refresh
                                        </button>
                                    </div>
                                </div>

                                {/* Row 2: O.Bal Date, Payable Radio, Account Active */}
                                <div className="row align-items-center g-2">
                                    <div className="col-md-3">
                                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>O.Bal Date</label>
                                    </div>
                                    <div className="col-md-3">
                                        <select
                                            name="balanceDate"
                                            value={formData.balanceDate}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #999', fontSize: '13px' }}
                                        >
                                            <option>29-Mar-22</option>
                                            <option>11-Nov-25</option>
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label style={{ fontSize: '13px' }}>
                                            <input
                                                type="radio"
                                                name="balanceType"
                                                value="Payable"
                                                checked={formData.balanceType === 'Payable'}
                                                onChange={handleRadioChange}
                                            /> Payable
                                        </label>
                                    </div>
                                    <div className="col-md-3">
                                        <label style={{ fontSize: '13px' }}>
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                            /> Account is active
                                        </label>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="row mt-3">
                                    <div className="col-12">
                                        <div className="d-flex flex-wrap gap-2 justify-content-end">
                                            <button onClick={handleRefresh} style={{...buttonStyle, backgroundColor: '#17a2b8', color: 'white', border: '1px solid #138496'}}>
                                                <span>➕</span> Add New
                                            </button>
                                            <button onClick={handleSave} style={buttonStyle} disabled={saving}>
                                                <span>💾</span> Save
                                            </button>
                                            <button onClick={handleUpdate} style={buttonStyle} disabled={updating}>
                                                <span>📝</span> Update
                                            </button>
                                            <button onClick={handleDelete} style={buttonStyle} disabled={deleting}>
                                                <span>🗑️</span> Delete
                                            </button>
                                            <button onClick={handleClose} style={{...buttonStyle, backgroundColor: '#dc3545', color: 'white', border: '1px solid #c82333'}}>
                                                <span>❌</span> Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChartOfAccounts;