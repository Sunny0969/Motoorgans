import React from 'react';

const PaperSizeSelector = ({ value, onChange, style }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', ...style }}>
      <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Paper:</label>
      {['A5', 'A4', 'Thermal'].map(size => (
        <button
          key={size}
          onClick={() => onChange(size)}
          style={{
            padding: '2px 10px',
            fontSize: '10px',
            border: value === size ? '2px inset #006060' : '1px solid #999',
            backgroundColor: value === size ? '#006060' : '#f0f0f0',
            color: value === size ? '#fff' : '#333',
            cursor: 'pointer',
            borderRadius: '3px',
            fontWeight: value === size ? 'bold' : 'normal',
          }}
        >
          {size}
        </button>
      ))}
    </div>
  );
};

export default PaperSizeSelector;
