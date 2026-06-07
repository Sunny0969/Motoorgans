import React, { useState, useEffect } from 'react';

const ChangeFontColor = () => {
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [linkColor, setLinkColor] = useState('#0000ff');
  const [headingColor, setHeadingColor] = useState('#333333');
  const [isApplied, setIsApplied] = useState(false);
  const [contrastRatio, setContrastRatio] = useState(21);

  const colorPresets = [
    { name: 'Classic', text: '#000000', bg: '#ffffff', link: '#0000ff', heading: '#333333' },
    { name: 'Dark Mode', text: '#ffffff', bg: '#121212', link: '#bb86fc', heading: '#e0e0e0' },
    { name: 'Warm', text: '#333333', bg: '#fdf6e3', link: '#cb4b16', heading: '#586e75' },
    { name: 'Cool', text: '#2c3e50', bg: '#ecf0f1', link: '#3498db', heading: '#34495e' },
    { name: 'High Contrast', text: '#000000', bg: '#ffff00', link: '#ff0000', heading: '#000000' }
  ];

  const calculateContrast = (text, bg) => {
    try {
      const hexToRgb = (hex) => {
        // Remove the # if present
        hex = hex.replace('#', '');
        
        // Parse the hex values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return { r, g, b };
      };

      const getLuminance = (r, g, b) => {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };

      const textRgb = hexToRgb(text);
      const bgRgb = hexToRgb(bg);
      
      const textLum = getLuminance(textRgb.r, textRgb.g, textRgb.b);
      const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
      
      const lighter = Math.max(textLum, bgLum);
      const darker = Math.min(textLum, bgLum);
      const contrast = (lighter + 0.05) / (darker + 0.05);
      
      return Math.round(contrast * 100) / 100;
    } catch (error) {
      return 21; // Default high contrast if calculation fails
    }
  };

  useEffect(() => {
    const ratio = calculateContrast(textColor, backgroundColor);
    setContrastRatio(ratio);
  }, [textColor, backgroundColor]);

  const handleApplyColors = () => {
    setIsApplied(true);
    
    // Apply colors to entire document
    document.body.style.color = textColor;
    document.body.style.backgroundColor = backgroundColor;
    
    // Apply link colors
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      link.style.color = linkColor;
    });
    
    // Apply heading colors
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      heading.style.color = headingColor;
    });
  };

  const handleReset = () => {
    setTextColor('#000000');
    setBackgroundColor('#ffffff');
    setLinkColor('#0000ff');
    setHeadingColor('#333333');
    setIsApplied(false);
    
    // Reset to default
    document.body.style.color = '';
    document.body.style.backgroundColor = '';
    
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      link.style.color = '';
    });
    
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      heading.style.color = '';
    });
  };

  const handleColorChange = (type, color) => {
    // Ensure color starts with #
    if (!color.startsWith('#')) {
      color = '#' + color;
    }
    
    // Validate hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(color)) {
      return; // Don't update if invalid color
    }

    switch(type) {
      case 'text':
        setTextColor(color);
        break;
      case 'bg':
        setBackgroundColor(color);
        break;
      case 'link':
        setLinkColor(color);
        break;
      case 'heading':
        setHeadingColor(color);
        break;
      default:
        break;
    }
  };

  const handlePresetSelect = (preset) => {
    setTextColor(preset.text);
    setBackgroundColor(preset.bg);
    setLinkColor(preset.link);
    setHeadingColor(preset.heading);
  };

  const getContrastRating = (ratio) => {
    if (ratio >= 7) return { text: 'Excellent', color: '#27ae60' };
    if (ratio >= 4.5) return { text: 'Good', color: '#f39c12' };
    if (ratio >= 3) return { text: 'Fair', color: '#e67e22' };
    return { text: 'Poor', color: '#e74c3c' };
  };

  const contrastRating = getContrastRating(contrastRatio);

  const handleSaveScheme = () => {
    const scheme = {
      textColor,
      backgroundColor,
      linkColor,
      headingColor
    };
    localStorage.setItem('savedColorScheme', JSON.stringify(scheme));
    alert('Color scheme saved successfully!');
  };

  const handleRestoreDefaults = () => {
    handleReset();
    localStorage.removeItem('savedColorScheme');
  };

  // Load saved scheme on component mount
  useEffect(() => {
    const savedScheme = localStorage.getItem('savedColorScheme');
    if (savedScheme) {
      try {
        const scheme = JSON.parse(savedScheme);
        setTextColor(scheme.textColor || '#000000');
        setBackgroundColor(scheme.backgroundColor || '#ffffff');
        setLinkColor(scheme.linkColor || '#0000ff');
        setHeadingColor(scheme.headingColor || '#333333');
      } catch (error) {
        console.error('Error loading saved color scheme:', error);
      }
    }
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Font Color Settings</h1>
      </div>

      {/* Current Settings */}
      <div style={styles.currentSettings}>
        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Text Color</label>
            <div style={styles.value}>
              <div style={{...styles.colorPreview, backgroundColor: textColor}}></div>
              {textColor}
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Background Color</label>
            <div style={styles.value}>
              <div style={{...styles.colorPreview, backgroundColor: backgroundColor}}></div>
              {backgroundColor}
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Link Color</label>
            <div style={styles.value}>
              <div style={{...styles.colorPreview, backgroundColor: linkColor}}></div>
              {linkColor}
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Heading Color</label>
            <div style={styles.value}>
              <div style={{...styles.colorPreview, backgroundColor: headingColor}}></div>
              {headingColor}
            </div>
          </div>
        </div>
      </div>

      {/* Color Configuration */}
      <div style={styles.configSection}>
        <h3 style={styles.sectionTitle}>Color Configuration</h3>
        
        <div style={styles.configGrid}>
          {/* Text Color */}
          <div style={styles.configGroup}>
            <label style={styles.configLabel}>Text Color</label>
            <div style={styles.colorInputGroup}>
              <input 
                type="color"
                value={textColor}
                onChange={(e) => handleColorChange('text', e.target.value)}
                style={styles.colorInput}
              />
              <input 
                type="text"
                value={textColor}
                onChange={(e) => handleColorChange('text', e.target.value)}
                style={styles.colorTextInput}
                placeholder="#000000"
                maxLength="7"
              />
            </div>
          </div>

          {/* Background Color */}
          <div style={styles.configGroup}>
            <label style={styles.configLabel}>Background Color</label>
            <div style={styles.colorInputGroup}>
              <input 
                type="color"
                value={backgroundColor}
                onChange={(e) => handleColorChange('bg', e.target.value)}
                style={styles.colorInput}
              />
              <input 
                type="text"
                value={backgroundColor}
                onChange={(e) => handleColorChange('bg', e.target.value)}
                style={styles.colorTextInput}
                placeholder="#ffffff"
                maxLength="7"
              />
            </div>
          </div>

          {/* Link Color */}
          <div style={styles.configGroup}>
            <label style={styles.configLabel}>Link Color</label>
            <div style={styles.colorInputGroup}>
              <input 
                type="color"
                value={linkColor}
                onChange={(e) => handleColorChange('link', e.target.value)}
                style={styles.colorInput}
              />
              <input 
                type="text"
                value={linkColor}
                onChange={(e) => handleColorChange('link', e.target.value)}
                style={styles.colorTextInput}
                placeholder="#0000ff"
                maxLength="7"
              />
            </div>
          </div>

          {/* Heading Color */}
          <div style={styles.configGroup}>
            <label style={styles.configLabel}>Heading Color</label>
            <div style={styles.colorInputGroup}>
              <input 
                type="color"
                value={headingColor}
                onChange={(e) => handleColorChange('heading', e.target.value)}
                style={styles.colorInput}
              />
              <input 
                type="text"
                value={headingColor}
                onChange={(e) => handleColorChange('heading', e.target.value)}
                style={styles.colorTextInput}
                placeholder="#333333"
                maxLength="7"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contrast Checker */}
      <div style={styles.contrastSection}>
        <h3 style={styles.sectionTitle}>Contrast Checker</h3>
        <div style={styles.contrastInfo}>
          <div style={styles.contrastRatio}>
            <span style={styles.contrastLabel}>Contrast Ratio:</span>
            <span style={styles.contrastValue}>{contrastRatio}:1</span>
          </div>
          <div style={styles.contrastRating}>
            <span style={styles.ratingLabel}>Accessibility:</span>
            <span style={{...styles.ratingValue, color: contrastRating.color}}>
              {contrastRating.text}
            </span>
          </div>
        </div>
        <div style={styles.contrastScale}>
          <div style={styles.scaleBar}>
            <div style={styles.scalePoor}>Poor</div>
            <div style={styles.scaleFair}>Fair</div>
            <div style={styles.scaleGood}>Good</div>
            <div style={styles.scaleExcellent}>Excellent</div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div style={styles.previewSection}>
        <h3 style={styles.sectionTitle}>Live Preview</h3>
        <div 
          style={{
            ...styles.previewBox,
            color: textColor,
            backgroundColor: backgroundColor
          }}
        >
          <h1 style={{color: headingColor, margin: '0 0 15px 0', fontSize: '24px'}}>Sample Heading</h1>
          <p style={{margin: '0 0 10px 0', lineHeight: '1.6'}}>
            This is a sample paragraph showing how your text will look with the selected colors. 
            The quick brown fox jumps over the lazy dog.
          </p>
          <p style={{margin: '0 0 10px 0', lineHeight: '1.6'}}>
            Another paragraph to demonstrate the color combination and readability.
          </p>
          <a 
            href="#!" 
            style={{
              color: linkColor,
              textDecoration: 'underline',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            This is a sample link
          </a>
        </div>
      </div>

      {/* Color Presets */}
      <div style={styles.presetSection}>
        <h3 style={styles.sectionTitle}>Quick Presets</h3>
        <div style={styles.presetGrid}>
          {colorPresets.map((preset, index) => (
            <button
              key={index}
              style={styles.presetButton}
              onClick={() => handlePresetSelect(preset)}
            >
              <div style={styles.presetPreview}>
                <div 
                  style={{
                    ...styles.presetColorBlock,
                    backgroundColor: preset.bg,
                    color: preset.text
                  }}
                >
                  Aa
                </div>
                <div style={styles.presetColors}>
                  <div style={{...styles.presetColorDot, backgroundColor: preset.text}} title="Text"></div>
                  <div style={{...styles.presetColorDot, backgroundColor: preset.bg}} title="Background"></div>
                  <div style={{...styles.presetColorDot, backgroundColor: preset.link}} title="Link"></div>
                  <div style={{...styles.presetColorDot, backgroundColor: preset.heading}} title="Heading"></div>
                </div>
              </div>
              <span style={styles.presetName}>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status and Actions */}
      <div style={styles.statusSection}>
        <div style={styles.statusRow}>
          <div style={styles.statusItem}>
            <label style={styles.statusLabel}>Current Status</label>
            <div style={styles.statusValue}>
              {isApplied ? 'Colors Applied' : 'Not Applied'}
            </div>
          </div>
          <div style={styles.statusItem}>
            <label style={styles.statusLabel}>Contrast Status</label>
            <div style={{...styles.statusValue, color: contrastRating.color}}>
              {contrastRating.text} ({contrastRatio}:1)
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.actionButtons}>
        <button style={styles.resetButton} onClick={handleReset}>
          Reset
        </button>
        <button style={styles.applyButton} onClick={handleApplyColors}>
          Apply Colors
        </button>
        <button style={styles.saveButton} onClick={handleSaveScheme}>
          Save Scheme
        </button>
        <button style={styles.defaultButton} onClick={handleRestoreDefaults}>
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
    alignItems: 'center',
    gap: '10px'
  },
  colorPreview: {
    width: '20px',
    height: '20px',
    borderRadius: '3px',
    border: '1px solid #ddd'
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
  colorInputGroup: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  colorInput: {
    width: '60px',
    height: '40px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    cursor: 'pointer'
  },
  colorTextInput: {
    flex: '1',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '14px',
    fontFamily: 'monospace'
  },
  contrastSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  contrastInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  contrastRatio: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  contrastLabel: {
    fontWeight: 'bold',
    color: '#333'
  },
  contrastValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  contrastRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  ratingLabel: {
    fontWeight: 'bold',
    color: '#333'
  },
  ratingValue: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  contrastScale: {
    marginTop: '15px'
  },
  scaleBar: {
    display: 'flex',
    height: '30px',
    borderRadius: '5px',
    overflow: 'hidden'
  },
  scalePoor: {
    flex: '1',
    backgroundColor: '#e74c3c',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  scaleFair: {
    flex: '1',
    backgroundColor: '#e67e22',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  scaleGood: {
    flex: '1',
    backgroundColor: '#f39c12',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  scaleExcellent: {
    flex: '1',
    backgroundColor: '#27ae60',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold'
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
    minHeight: '200px',
    transition: 'all 0.3s ease'
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
    gap: '15px'
  },
  presetButton: {
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.2s ease'
  },
  presetPreview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  presetColorBlock: {
    width: '60px',
    height: '40px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  presetColors: {
    display: 'flex',
    gap: '4px'
  },
  presetColorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '1px solid #ddd'
  },
  presetName: {
    fontWeight: 'bold',
    color: '#333'
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

export default ChangeFontColor;