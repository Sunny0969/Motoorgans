// src/components/Header.js
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Offcanvas } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

const TOOLBAR_ACTIVE_BG = '#7eb8e8';
const TOOLBAR_ACTIVE_BORDER = '#2e6da4';
const TOOLBAR_IDLE_BG = '#d0d0d0';
const TOOLBAR_HOVER_BG = '#b8cfe0';
const MENU_ACTIVE_BG = '#3d6fa8';
const MENU_OPEN_BG = '#5a5a5a';

function Header() {
  const [show, setShow] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loginTime, logout } = useAuth();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const menuItems = [
    { icon: '👥', label: 'Chart of Accounts' },
    { icon: '📝', label: 'Purchase' },
    { icon: '🛒', label: 'Sale Order' },
    { icon: '🧮', label: 'Sale' },
    { icon: '➕', label: 'Cash Receipt' },
    { icon: '➖', label: 'Cash Payment' },
    { icon: '📄', label: 'Journal Voucher' },
    { icon: '🔍', label: 'General Ledgers' },
    { icon: '📊', label: 'Trial Balance' },
    { icon: '❌', label: 'Exit' }
  ];

  const dropdownMenus = {
    'Define': [
      'Financial Statement Levels',
      'Class of Transaction Levels',
      'Group of Accounts Levels',
      'Chart of Accounts',
      'Chart of Locations',
      'Chart of Products',
      'Company',
      'Bill of Material',
      'Chart of Employee',
    ],
    'Vouchers': [
      'Demand Order',
      'Opening Stock',
      'Stock Transfer',
      'Stock Adjustment',
      'Production',
      'Purchase Order',
      'Purchase',
      'Purchase Return',
      'Claim Out To Suppliers',
      'Sale Order',
      'Sale',
      'Sale Return',
      'Claim In From Customer',
      'Exchange',
      'Cash Reciept',
      'Cash Payment',
      'Bank Reciept',
      'Bank Payment',
      'Cheque Transfer',
      'Journal Voucher',
      'Salary Slip'

    ],
    'Reports': [
      'Shop List',
      'Chart of Accounts',
      'Chart of Accounts Urdu',
      'Chart of Products',
      'Chart of Products Urdu',
      'Rate List',
      'D.O',
      'P.O',
      'Purchase',
      'Purchase Return',
      'Sale Order',
      'Sales',
      'Sales Return',
      'Stock',
      'Cash Receipt',
      'Cash Payment',
      'Bank Deposit',
      'Bank Payments',
      'Journal Voucher',
      'Salary Sheet',
      'Expenses',
      'Account Payable / Receivable',
      'Monthly Transaction Report',
      'Account Activity Report',
      'Account Status Report',
      'General Ledgers',
      'Customer Details',
      'Items',
      'Product History',
      'PS Detail',
      'Ledger',
      'Sales Invoice',
    ],
    'Final Accounts': [
      'Trail Balance',
      'Trial Balance SPO wise',
      'Profit Loss',
      'Statement of Final Position',
      
    ],
    'Tools': [
      'Day Close',
      'User Permission',
      'Create Backup',
      'Restore Backup',
      'clear Data',
      'Change Font',
      'Change Font Color',
      'Login',
      'Events Log Reports',
      'Main Page Setting'
    ],
    'SMS': [
      'Send SMS',
      'Configurations',
      // 'SMS History',
      // 'Bulk SMS',
      // 'SMS Settings',
      // 'Contact Groups',
      // 'SMS Reports',
      // 'SMS Balance'
    ],
    'Windows': [
      'opened windows'
      // 'Cascade Windows',
      // 'Tile Horizontal',
      // 'Tile Vertical',
      // 'Close All',
      // 'Minimize All',
      // 'Restore All',
      // 'Switch Window',
      // 'Window List'
    ],
    'Help': [
      // 'User Manual',
      // 'Video Tutorials',
      // 'FAQs',
      // 'Contact Support',
      // 'Check Updates',
      // 'About Software',
      // 'License Info',
      // 'Report Bug'
    ]
  };

  const navItems = Object.keys(dropdownMenus);

  const createSlug = (text) => {
    return text.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and').replace(/\//g, '-');
  };

  const toolbarRouteMap = {
    'Chart of Accounts': [
      '/page/chart-of-accounts',
      '/define/chart-of-accounts',
      '/reports/chart-of-accounts',
    ],
    Purchase: ['/page/purchase', '/vouchers/purchase', '/reports/purchase'],
    'Sale Order': [
      '/page/sale-order',
      '/vouchers/sale-order',
      '/reports/sale-order',
    ],
    Sale: ['/page/sale', '/vouchers/sale', '/reports/sales'],
    'Cash Receipt': [
      '/page/cash-receipt',
      '/vouchers/cash-reciept',
      '/reports/cash-receipt',
    ],
    'Cash Payment': [
      '/page/cash-payment',
      '/vouchers/cash-payment',
      '/reports/cash-payment',
    ],
    'Journal Voucher': [
      '/page/journal-voucher',
      '/vouchers/journal-voucher',
      '/reports/journal-voucher',
    ],
    'General Ledgers': [
      '/page/general-ledgers',
      '/reports/general-ledgers',
      '/reports/ledger',
      '/page/ledger',
    ],
    'Trial Balance': [
      '/page/trial-balance',
      '/final-accounts/trail-balance',
      '/final-accounts/trial-balance-spo-wise',
    ],
    Exit: ['/exit'],
  };

  const voucherRouteMap = {
    'Demand Order': '/vouchers/demand-order',
    'Opening Stock': '/vouchers/opening-stock',
    'Stock Transfer': '/vouchers/stock-transfer',
    'Stock Adjustment': '/vouchers/stock-adjustment',
    Production: '/vouchers/production',
    'Purchase Order': '/vouchers/purchase-order',
    Purchase: '/vouchers/purchase',
    'Purchase Return': '/vouchers/purchase-return',
    'Claim Out To Suppliers': '/vouchers/claim-out-to-suppliers',
    'Sale Order': '/vouchers/sale-order',
    Sale: '/vouchers/sale',
    'Sale Return': '/vouchers/sale-return',
    'Claim In From Customer': '/vouchers/claim-in-from-customer',
    Exchange: '/vouchers/exchange',
    'Cash Reciept': '/vouchers/cash-reciept',
    'Cash Payment': '/vouchers/cash-payment',
    'Bank Reciept': '/vouchers/bank-receipt',
    'Bank Payment': '/vouchers/bank-payment',
    'Cheque Transfer': '/vouchers/cheque-transfer',
    'Journal Voucher': '/vouchers/journal-voucher',
    'Salary Slip': '/vouchers/salary-slip',
  };

  const isToolbarActive = (label) => {
    const path = location.pathname.toLowerCase();
    const routes = toolbarRouteMap[label] || [`/page/${createSlug(label)}`];
    return routes.some((route) => path === route || path.startsWith(`${route}/`));
  };

  const isTopMenuActive = (menu) => {
    const prefix = `/${createSlug(menu)}/`;
    return location.pathname.toLowerCase().startsWith(prefix);
  };

  const isDropdownItemActive = (menu, subItem) => {
    const path = location.pathname.toLowerCase();
    if (menu === 'Vouchers' && voucherRouteMap[subItem]) {
      return path === voucherRouteMap[subItem].toLowerCase();
    }
    const slugPath = `/${createSlug(menu)}/${createSlug(subItem)}`;
    return path === slugPath;
  };

  const getToolbarBackground = (label, isHovered = false) => {
    if (isToolbarActive(label)) return TOOLBAR_ACTIVE_BG;
    if (isHovered) return TOOLBAR_HOVER_BG;
    return TOOLBAR_IDLE_BG;
  };

  const handleMenuItemClick = (menu, item) => {
    if (menu === 'Vouchers' && voucherRouteMap[item]) {
      navigate(voucherRouteMap[item]);
    } else {
      const menuSlug = createSlug(menu);
      const itemSlug = createSlug(item);
      navigate(`/${menuSlug}/${itemSlug}`);
    }
    setActiveDropdown(null);
  };

  const toolbarPrimaryRouteMap = {
    'Chart of Accounts': '/define/chart-of-accounts',
    Purchase: '/vouchers/purchase',
    'Sale Order': '/vouchers/sale-order',
    Sale: '/vouchers/sale',
    'Cash Receipt': '/vouchers/cash-reciept',
    'Cash Payment': '/vouchers/cash-payment',
    'Journal Voucher': '/vouchers/journal-voucher',
    'General Ledgers': '/reports/general-ledgers',
    'Trial Balance': '/reports/trial-balance',
  };

  const handleButtonClick = (label) => {
    setActiveDropdown(null);
    if (label === 'Exit') {
      navigate('/exit');
    } else if (toolbarPrimaryRouteMap[label]) {
      navigate(toolbarPrimaryRouteMap[label]);
    } else {
      const slug = createSlug(label);
      navigate(`/page/${slug}`);
    }
  };

  const handleDropdownClick = (item) => {
    setActiveDropdown(activeDropdown === item ? null : item);
  };

  return (
    <div className="w-100">
      <div style={{
        backgroundColor: '#2b2b2b',
        color: '#fff',
        padding: '4px 12px',
        fontSize: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>
          Moto Organs Traders / User: {user || 'ADMIN'}
          {loginTime ? `, Login time: ${loginTime}` : ''}
          {location.pathname === '/' ? ' - [Dashboard]' : ''}
        </span>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              background: '#4a4a4a', color: '#fff', border: '1px solid #777',
              padding: '2px 10px', cursor: 'pointer', fontSize: '12px',
            }}
          >
            {user || 'ADMIN'} ▾
          </button>
          {userMenuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', backgroundColor: '#fff',
              border: '1px solid #999', minWidth: '160px', zIndex: 2002, color: '#000',
            }}>
              <button
                type="button"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                onClick={() => { setShowChangePassword(true); setUserMenuOpen(false); }}
              >
                Change Password
              </button>
              <button
                type="button"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                onClick={() => { logout(); navigate('/tools/login'); setUserMenuOpen(false); }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
      {/* Top Navigation Bar */}
      <div style={{
        backgroundColor: '#4a4a4a',
        padding: '6px 15px',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1001
      }}>
        {/* Hamburger Button */}
        <button 
          className="d-md-none"
          style={{
            color: '#ffffff',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '5px 10px',
            border: 'none',
            backgroundColor: 'transparent'
          }}
          onClick={handleShow}
          aria-label="Open menu"
        >
          ☰
        </button>

        {/* Desktop Navigation */}
        <div className="d-none d-md-flex gap-2">
          {navItems.map((item, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <span 
                style={{
                  color: '#ffffff',
                  fontSize: '13px',
                  fontFamily: 'Arial, sans-serif',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  transition: 'background-color 0.2s',
                  whiteSpace: 'nowrap',
                  borderRadius: '4px',
                  backgroundColor:
                    activeDropdown === item
                      ? MENU_OPEN_BG
                      : isTopMenuActive(item)
                        ? MENU_ACTIVE_BG
                        : 'transparent',
                  fontWeight: isTopMenuActive(item) ? 'bold' : 'normal',
                }}
                onClick={() => handleDropdownClick(item)}
                onMouseEnter={(e) => {
                  if (activeDropdown !== item && !isTopMenuActive(item)) {
                    e.target.style.backgroundColor = MENU_OPEN_BG;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeDropdown !== item) {
                    e.target.style.backgroundColor = isTopMenuActive(item)
                      ? MENU_ACTIVE_BG
                      : 'transparent';
                  }
                }}
              >
                {item} ▾
              </span>

              {/* Dropdown Menu */}
              {activeDropdown === item && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: '#ffffff',
                  minWidth: '280px',
                  maxHeight: 'calc(100vh - 120px)',
                  overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  zIndex: 1000,
                  marginTop: '5px',
                  border: '1px solid #e0e0e0'
                }}>
                  {dropdownMenus[item].map((subItem, subIdx) => (
                    <div
                      key={subIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 15px',
                        color: '#333',
                        fontSize: '13px',
                        fontFamily: 'Arial, sans-serif',
                        cursor: 'pointer',
                        borderBottom: subIdx === dropdownMenus[item].length - 1 ? 'none' : '1px solid #f5f5f5',
                        transition: 'all 0.2s ease',
                        backgroundColor: isDropdownItemActive(item, subItem)
                          ? '#e3f2fd'
                          : '#ffffff',
                        fontWeight: isDropdownItemActive(item, subItem) ? 'bold' : 'normal',
                        color: isDropdownItemActive(item, subItem) ? '#1565c0' : '#333',
                      }}
                      onClick={() => handleMenuItemClick(item, subItem)}
                      onMouseEnter={(e) => {
                        if (!isDropdownItemActive(item, subItem)) {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }
                        e.currentTarget.style.paddingLeft = '20px';
                        const arrow = e.currentTarget.querySelector('.arrow-icon');
                        if (arrow) {
                          arrow.style.opacity = '1';
                          arrow.style.transform = 'translateX(5px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDropdownItemActive(item, subItem)
                          ? '#e3f2fd'
                          : '#ffffff';
                        e.currentTarget.style.paddingLeft = '15px';
                        const arrow = e.currentTarget.querySelector('.arrow-icon');
                        if (arrow) {
                          arrow.style.opacity = '0.4';
                          arrow.style.transform = 'translateX(0)';
                        }
                      }}
                    >
                      <span style={{ flex: 1 }}>{subItem}</span>
                      <span 
                        className="arrow-icon"
                        style={{ 
                          color: '#ff8c00',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          opacity: '0.4',
                          transition: 'all 0.2s ease',
                          marginLeft: '10px'
                        }}
                      >
                        ►
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Title */}
        <span className="d-md-none text-white fw-bold" style={{ fontSize: '14px' }}>
          Trade Management System
        </span>
      </div>

      {/* Mobile Offcanvas Sidebar */}
      <Offcanvas show={show} onHide={handleClose} style={{ backgroundColor: '#4a4a4a' }}>
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="text-white">Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="d-flex flex-column gap-3">
            {navItems.map((item, idx) => (
              <div key={idx}>
                <div
                  style={{
                    color: '#ffffff',
                    fontSize: '13px',
                    fontFamily: 'Arial, sans-serif',
                    cursor: 'pointer',
                    padding: '10px 15px',
                    borderRadius: '4px',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => handleDropdownClick(item)}
                >
                  {item} ▾
                </div>
                
                {activeDropdown === item && (
                  <div style={{ paddingLeft: '20px', marginTop: '5px' }}>
                    {dropdownMenus[item].map((subItem, subIdx) => (
                      <div
                        key={subIdx}
                        style={{
                          color: '#ffffff',
                          fontSize: '12px',
                          fontFamily: 'Arial, sans-serif',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          marginBottom: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={() => {
                          handleMenuItemClick(item, subItem);
                          handleClose();
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#5a5a5a'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <span>• {subItem}</span>
                        <span style={{ color: '#ff8c00', marginLeft: '5px', fontSize: '12px' }}>►</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => { setActiveDropdown(null); setUserMenuOpen(false); }}
        />
      )}

      {/* Button Menu Bar */}
      <div style={{
        display: 'flex',
        backgroundColor: '#d0d0d0',
        borderTop: '1px solid #a0a0a0',
        borderBottom: '1px solid #a0a0a0',
        overflowX: 'auto',
        flexWrap: 'nowrap'
      }}>
        {menuItems.map((item, index) => {
          const active = isToolbarActive(item.label);
          return (
          <div
            key={index}
            style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 8px',
              backgroundColor: getToolbarBackground(item.label),
              borderRight: index === menuItems.length - 1 ? 'none' : '1px solid #a0a0a0',
              borderTop: active ? `3px solid ${TOOLBAR_ACTIVE_BORDER}` : '3px solid transparent',
              boxShadow: active ? 'inset 0 -2px 0 rgba(46, 109, 164, 0.35)' : 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s, border-color 0.2s',
              minWidth: '100px',
            }}
            onClick={() => handleButtonClick(item.label)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = getToolbarBackground(item.label, true);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = getToolbarBackground(item.label);
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '4px', lineHeight: '1' }}>
              {item.icon}
            </div>
            <div style={{
              fontSize: '11px',
              fontFamily: 'Arial, sans-serif',
              color: active ? '#0d3d6b' : '#000000',
              textAlign: 'center',
              lineHeight: '1.2',
              fontWeight: active ? 'bold' : 'normal',
            }}>
              {item.label}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

export default Header;