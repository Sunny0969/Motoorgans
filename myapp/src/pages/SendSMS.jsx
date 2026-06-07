import React, { useState } from 'react';

const SmsForm = () => {
  const [mobileNumber, setMobileNumber] = useState('0399999');
  const [message, setMessage] = useState('1, 0. GSM');
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);

  const handleSend = () => {
    // Send SMS functionality would go here
    alert('SMS Sent!');
  };

  const handleClearText = () => {
    setMessage('');
  };

  const handleClose = () => {
    // Close functionality would go here
    alert('Form Closed!');
  };

  return (
    <div style={{
      width: '400px',
      margin: '20px auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      border: '1px solid #ccc',
      borderRadius: '5px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <h2 style={{
        margin: '0 0 20px 0',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center'
      }}>
        SMS Form
      </h2>

      {/* Number List Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontWeight: 'bold',
          marginBottom: '5px',
          fontSize: '14px',
          color: '#333'
        }}>
          Number List
        </div>
        <div style={{
          marginBottom: '5px',
          fontSize: '14px',
          color: '#666'
        }}>
          Mobile
        </div>
        <input
          type="text"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            fontSize: '14px',
            marginBottom: '5px'
          }}
        />
      </div>

      {/* SMS Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontWeight: 'bold',
          marginBottom: '5px',
          fontSize: '14px',
          color: '#333'
        }}>
          SMS
        </div>
        <div style={{
          marginBottom: '5px',
          fontSize: '14px',
          color: '#666'
        }}>
          Message Body
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows="4"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            fontSize: '14px',
            resize: 'vertical',
            fontFamily: 'Arial, sans-serif',
            marginBottom: '5px'
          }}
        />
        <div style={{
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          Sending 0 of 0
        </div>
      </div>

      {/* Connect Device Checkbox */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '14px',
          color: '#333',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={isDeviceConnected}
            onChange={(e) => setIsDeviceConnected(e.target.checked)}
            style={{
              marginRight: '8px'
            }}
          />
          Connect Device
        </label>
      </div>

      {/* Buttons */}
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={handleSend}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Send
        </button>
        <button
          onClick={handleClearText}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            border: '1px solid #ccc',
            borderRadius: '3px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Clear Text
        </button>
        <button
          onClick={handleClose}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            border: '1px solid #ccc',
            borderRadius: '3px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SmsForm;