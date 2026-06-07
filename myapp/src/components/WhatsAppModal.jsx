import React from 'react';

const WhatsAppModal = ({ isOpen, onClose, onYes, onNo }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', padding: '30px',
        width: '400px', maxWidth: '90%', textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📱</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#333' }}>Send via WhatsApp?</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            Do you want to send this invoice to the customer via WhatsApp?
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onYes}
            style={{
              padding: '10px 30px', border: 'none', borderRadius: '8px',
              backgroundColor: '#25D366', color: '#fff', fontSize: '14px',
              fontWeight: 'bold', cursor: 'pointer', minWidth: '100px'
            }}
          >
            Yes, Send
          </button>
          <button
            onClick={onNo}
            style={{
              padding: '10px 30px', border: '1px solid #ddd', borderRadius: '8px',
              backgroundColor: '#f5f5f5', color: '#333', fontSize: '14px',
              fontWeight: 'bold', cursor: 'pointer', minWidth: '100px'
            }}
          >
            No, Skip
          </button>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '15px', background: 'none', border: 'none',
            color: '#999', fontSize: '12px', cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default WhatsAppModal;
