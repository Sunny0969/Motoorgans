// src/components/HeroSection.js
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function HeroSection() {
  const containerStyle = {
    minHeight: '80vh',
    background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #2d2d2d 100%)',
    position: 'relative',
    overflow: 'hidden'
  };

  const orangeBorderStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '15px',
    height: '100%',
    backgroundColor: '#ff8c00',
    zIndex: 2
  };

  const bgIconStyle = {
    position: 'absolute',
    fontSize: '80px',
    opacity: '0.05',
    color: '#666'
  };

  const graphLineStyle = {
    position: 'absolute',
    top: '-50px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1
  };

  return (
    <div style={containerStyle} className="d-flex align-items-center justify-content-center">
      {/* Orange Left Border */}
      <div style={orangeBorderStyle}></div>

      {/* Background Icons */}
      <div style={{ ...bgIconStyle, top: '10%', left: '10%', transform: 'rotate(-15deg)' }}>⚙️</div>
      <div style={{ ...bgIconStyle, top: '20%', right: '15%', transform: 'rotate(20deg)' }}>📊</div>
      <div style={{ ...bgIconStyle, bottom: '20%', left: '15%', transform: 'rotate(10deg)' }}>💼</div>
      <div style={{ ...bgIconStyle, bottom: '15%', right: '20%', transform: 'rotate(-20deg)' }}>📈</div>
      <div style={{ ...bgIconStyle, top: '50%', left: '5%', transform: 'rotate(25deg)' }}>⚙️</div>
      <div style={{ ...bgIconStyle, top: '60%', right: '10%', transform: 'rotate(-10deg)' }}>🔧</div>

      {/* Main Content */}
      <div className="text-center px-3 px-md-5" style={{ position: 'relative', zIndex: 3, maxWidth: '1200px' }}>
        
        {/* Title */}
        <h1 
          className="text-white mb-5 display-3" 
          style={{ 
            fontWeight: '300', 
            letterSpacing: '2px',
            fontSize: 'clamp(2rem, 5vw, 4.5rem)'
          }}
        >
          Trade Management System
        </h1>

        {/* Logo with Graph */}
        <div className="position-relative d-inline-block mb-4" style={{ marginTop: '60px' }}>
          {/* Graph Line SVG */}
          <svg 
            style={graphLineStyle}
            width="200" 
            height="100" 
            viewBox="0 0 200 100"
            className="d-none d-md-block"
          >
            <polyline
              points="20,80 50,50 80,30 110,45 140,35 170,50 200,40"
              fill="none"
              stroke="#ff8c00"
              strokeWidth="2"
            />
            <circle cx="20" cy="80" r="5" fill="#ff8c00" />
            <circle cx="50" cy="50" r="5" fill="#ff8c00" />
            <circle cx="80" cy="30" r="5" fill="#ff8c00" />
            <circle cx="110" cy="45" r="5" fill="#ff8c00" />
            <circle cx="140" cy="35" r="5" fill="#ff8c00" />
            <circle cx="170" cy="50" r="5" fill="#ff8c00" />
            <circle cx="200" cy="40" r="5" fill="#ff8c00" />
          </svg>

          {/* RATHISOFT Text */}
          <div 
            style={{ 
              fontSize: 'clamp(3rem, 8vw, 7.5rem)',
              fontWeight: '300',
              letterSpacing: '8px',
              lineHeight: '1'
            }}
          >
            <span style={{ color: '#ff8c00' }}>RATHI</span>
            <span className="text-white">SOFT</span>
          </div>
        </div>

        {/* Tagline */}
        <p 
          className="text-white my-4" 
          style={{ 
            fontSize: 'clamp(1.2rem, 2.5vw, 2rem)',
            fontWeight: '300',
            letterSpacing: '1px'
          }}
        >
          Your Imagination, <span style={{ color: '#ff8c00', fontWeight: '400' }}>Our Innovation</span>
        </p>

        {/* Website Link */}
        <div className="d-flex align-items-center justify-content-center mt-4">
          <span style={{ fontSize: '24px', marginRight: '10px' }}>🔶</span>
          <a 
            href="https://www
            .rathisoft.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white text-decoration-none"
            style={{ 
              fontSize: 'clamp(1.2rem, 2vw, 1.75rem)',
              transition: 'color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#ff8c00'}
            onMouseLeave={(e) => e.target.style.color = '#ffffff'}
          >
www.rathisoft.com          </a>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;