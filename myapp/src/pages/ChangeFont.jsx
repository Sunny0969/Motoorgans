import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ChangeFont = () => {
  const [currentFont, setCurrentFont] = useState('Arial');
  const [fontSize, setFontSize] = useState(16);
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontStyle, setFontStyle] = useState('normal');
  const [isApplied, setIsApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/font-settings');
        const settings = response.data;
        setCurrentFont(settings.fontFamily);
        setFontSize(settings.fontSize);
        setFontWeight(settings.fontWeight);
        setFontStyle(settings.fontStyle);
        setIsApplied(settings.isApplied);
      } catch (error) {
        console.error('Error loading font settings:', error);
        // Use defaults if error
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const fontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Tahoma',
    'Trebuchet MS',
    'Impact',
    'Comic Sans MS',
    'Courier New',
    'Lucida Console',
    'Palatino',
    'Garamond',
    'Bookman',
    'Franklin Gothic'
  ];

  const fontWeights = [
    { value: 'normal', label: 'Normal' },
    { value: 'bold', label: 'Bold' },
    { value: 'lighter', label: 'Lighter' },
    { value: 'bolder', label: 'Bolder' },
    { value: '100', label: '100' },
    { value: '200', label: '200' },
    { value: '300', label: '300' },
    { value: '400', label: '400' },
    { value: '500', label: '500' },
    { value: '600', label: '600' },
    { value: '700', label: '700' },
    { value: '800', label: '800' },
    { value: '900', label: '900' }
  ];

  const fontStyles = [
    { value: 'normal', label: 'Normal' },
    { value: 'italic', label: 'Italic' },
    { value: 'oblique', label: 'Oblique' }
  ];

  const handleApplyFont = () => {
    setIsApplied(true);
    // Apply font to entire document
    document.body.style.fontFamily = currentFont;
    document.body.style.fontSize = `${fontSize}px`;
    document.body.style.fontWeight = fontWeight;
    document.body.style.fontStyle = fontStyle;
  };

  const handleReset = () => {
    setCurrentFont('Arial');
    setFontSize(16);
    setFontWeight('normal');
    setFontStyle('normal');
    setIsApplied(false);
    
    // Reset to default
    document.body.style.fontFamily = '';
    document.body.style.fontSize = '';
    document.body.style.fontWeight = '';
    document.body.style.fontStyle = '';
  };

  const previewText = "The quick brown fox jumps over the lazy dog";

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Font Settings</h1>
      </div>

      {/* Current Settings */}
      <div style={styles.currentSettings}>
        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Current Font</label>
            <div style={styles.value}>{currentFont}</div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Font Size</label>
            <div style={styles.value}>{fontSize}px</div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Font Weight</label>
            <div style={styles.value}>
              {fontWeights.find(fw => fw.value === fontWeight)?.label || fontWeight}
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Font Style</label>
            <div style={styles.value}>
              {fontStyles.find(fs => fs.value === fontStyle)?.label || fontStyle}
            </div>
          </div>
        </div>
      </div>

      {/* Font Configuration */}
      <div style={styles.configSection}>
        <h3 style={styles.sectionTitle}>Font Configuration</h3>
        
        <div style={styles.configGrid}>
          {/* Font Family Selection */}
          <div style={styles.configGroup}>
            <label style={styles.configLabel}>Font Family</label>
            <select 
              style={{...styles.select, fontFamily: currentFont}}
              value={currentFont}
              onChange={(e) => setCurrentFont(e.target.value)}
            >
              {fontFamilies.map(font => (
                <option key={font} value={font} style={{fontFamily: font}}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size Selection */}
          <div style={styles.configGroup}>
            <label style={styles.configLabel}>Font Size</label>
            <div style={styles.rangeContainer}>
              <input 
                type="range"
                min="8"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                style={styles.rangeInput}
              />
              <span style={styles.rangeValue}>{fontSize}px</span>
            </div>
            <div style={styles.sizeButtons}>
              {[12, 14, 16, 18, 20, 24, 32].map(size => (
                <button
                  key={size}
                  style={{
                    ...styles.sizeButton,
                    ...(fontSize === size ? styles.sizeButtonActive : {})
                  }}
                  onClick={() => setFontSize(size)}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          {/* Font Weight Selection */}
          <div style={styles.configGroup}>
            <label style={styles.configLabel}>Font Weight</label>
            <select 
              style={styles.select}
              value={fontWeight}
              onChange={(e) => setFontWeight(e.target.value)}
            >
              {fontWeights.map(weight => (
                <option key={weight.value} value={weight.value}>
                  {weight.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Style Selection */}
          <div style={styles.configGroup}>
            <label style={styles.configLabel}>Font Style</label>
            <div style={styles.styleButtons}>
              {fontStyles.map(style => (
                <button
                  key={style.value}
                  style={{
                    ...styles.styleButton,
                    ...(fontStyle === style.value ? styles.styleButtonActive : {}),
                    fontStyle: style.value
                  }}
                  onClick={() => setFontStyle(style.value)}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div style={styles.previewSection}>
        <h3 style={styles.sectionTitle}>Preview</h3>
        <div 
          style={{
            ...styles.previewBox,
            fontFamily: currentFont,
            fontSize: `${fontSize}px`,
            fontWeight: fontWeight,
            fontStyle: fontStyle
          }}
        >
          {previewText}
        </div>
        <div style={styles.previewDetails}>
          <span style={styles.previewDetail}>Font: {currentFont}</span>
          <span style={styles.previewDetail}>Size: {fontSize}px</span>
          <span style={styles.previewDetail}>Weight: {fontWeight}</span>
          <span style={styles.previewDetail}>Style: {fontStyle}</span>
        </div>
      </div>

      {/* Preset Fonts */}
      <div style={styles.presetSection}>
        <h3 style={styles.sectionTitle}>Quick Presets</h3>
        <div style={styles.presetGrid}>
          <button 
            style={styles.presetButton}
            onClick={() => {
              setCurrentFont('Arial');
              setFontSize(16);
              setFontWeight('normal');
              setFontStyle('normal');
            }}
          >
            Default
          </button>
          <button 
            style={{...styles.presetButton, fontFamily: 'Times New Roman'}}
            onClick={() => {
              setCurrentFont('Times New Roman');
              setFontSize(18);
              setFontWeight('normal');
              setFontStyle('normal');
            }}
          >
            Classic
          </button>
          <button 
            style={{...styles.presetButton, fontFamily: 'Georgia', fontStyle: 'italic'}}
            onClick={() => {
              setCurrentFont('Georgia');
              setFontSize(17);
              setFontWeight('normal');
              setFontStyle('italic');
            }}
          >
            Elegant
          </button>
          <button 
            style={{...styles.presetButton, fontFamily: 'Courier New', fontWeight: 'bold'}}
            onClick={() => {
              setCurrentFont('Courier New');
              setFontSize(16);
              setFontWeight('bold');
              setFontStyle('normal');
            }}
          >
            Monospace
          </button>
        </div>
      </div>

      {/* Status and Actions */}
      <div style={styles.statusSection}>
        <div style={styles.statusRow}>
          <div style={styles.statusItem}>
            <label style={styles.statusLabel}>Current Status</label>
            <div style={styles.statusValue}>
              {isApplied ? 'Font Applied' : 'Not Applied'}
            </div>
          </div>
          <div style={styles.statusItem}>
            <label style={styles.statusLabel}>Applied Font</label>
            <div style={styles.statusValue}>
              {isApplied ? currentFont : 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.actionButtons}>
        <button style={styles.resetButton} onClick={handleReset}>
          Reset
        </button>
        <button style={styles.applyButton} onClick={handleApplyFont}>
          Apply Font
        </button>
        <button
          style={styles.saveButton}
          onClick={async () => {
            try {
              await api.post('/font-settings', {
                userId: 'global',
                fontFamily: currentFont,
                fontSize,
                fontWeight,
                fontStyle,
                isApplied
              });
              alert('Settings saved successfully!');
            } catch (error) {
              console.error('Error saving settings:', error);
              alert('Failed to save settings.');
            }
          }}
        >
          Save Settings
        </button>
        <button
          style={styles.defaultButton}
          onClick={async () => {
            try {
              await api.put('/font-settings/reset/global');
              setCurrentFont('Arial');
              setFontSize(16);
              setFontWeight('normal');
              setFontStyle('normal');
              setIsApplied(false);
              document.body.style.fontFamily = '';
              document.body.style.fontSize = '';
              document.body.style.fontWeight = '';
              document.body.style.fontStyle = '';
              alert('Defaults restored successfully!');
            } catch (error) {
              console.error('Error restoring defaults:', error);
              alert('Failed to restore defaults.');
            }
          }}
        >
          Restore Defaults
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '15px',
    borderRadius: '5px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold'
  },
  currentSettings: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px'
  },
  fieldGroup: {
    flex: '1 1 200px',
    minWidth: '150px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px'
  },
  value: {
    padding: '8px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '14px',
    minHeight: '35px',
    display: 'flex',
    alignItems: 'center'
  },
  configSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    color: '#2c3e50',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  configGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  configGroup: {
    marginBottom: '15px'
  },
  configLabel: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#333'
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  rangeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px'
  },
  rangeInput: {
    flex: '1',
    height: '5px',
    borderRadius: '5px',
    background: '#ddd',
    outline: 'none'
  },
  rangeValue: {
    minWidth: '50px',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  sizeButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px'
  },
  sizeButton: {
    padding: '5px 10px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px'
  },
  sizeButtonActive: {
    backgroundColor: '#3498db',
    color: 'white',
    borderColor: '#3498db'
  },
  styleButtons: {
    display: 'flex',
    gap: '10px'
  },
  styleButton: {
    flex: '1',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  },
  styleButtonActive: {
    backgroundColor: '#3498db',
    color: 'white',
    borderColor: '#3498db'
  },
  previewSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  previewBox: {
    padding: '30px',
    border: '2px solid #e9ecef',
    borderRadius: '5px',
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
    marginBottom: '15px',
    minHeight: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    justifyContent: 'center'
  },
  previewDetail: {
    padding: '5px 10px',
    backgroundColor: '#e9ecef',
    borderRadius: '3px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  presetSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px'
  },
  presetButton: {
    padding: '15px 10px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  statusSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  statusRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px'
  },
  statusItem: {
    flex: '1 1 200px',
    minWidth: '150px'
  },
  statusLabel: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px'
  },
  statusValue: {
    padding: '8px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '14px',
    minHeight: '35px',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 'bold'
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  resetButton: {
    padding: '12px 25px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    minWidth: '120px'
  },
  applyButton: {
    padding: '12px 25px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    minWidth: '120px'
  },
  saveButton: {
    padding: '12px 25px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    minWidth: '120px'
  },
  defaultButton: {
    padding: '12px 25px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    minWidth: '120px'
  }
};

export default ChangeFont;