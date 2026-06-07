const PAPER_SIZES = {
  A5: { name: 'A5', width: '5.83in', height: '8.27in', fontSize: '11px', padding: '10px', windowSize: 'width=600,height=700' },
  A4: { name: 'A4', width: '8.27in', height: '11.69in', fontSize: '12px', padding: '25px', windowSize: 'width=900,height=800' },
  Thermal: { name: 'Thermal', width: '3.15in', height: 'auto', fontSize: '9px', padding: '5px 8px', windowSize: 'width=350,height=600' },
};

export function getPaperStyle(size = 'A5') {
  const paper = PAPER_SIZES[size] || PAPER_SIZES.A5;
  if (size === 'Thermal') {
    return `
      @page { size: 80mm auto; margin: 2mm; }
      body { font-family: 'Courier New', monospace; font-size: ${paper.fontSize}; padding: ${paper.padding}; width: ${paper.width}; margin: 0 auto; color: #000; }
      @media print { body { width: ${paper.width}; padding: 2mm; } }
    `;
  }
  return `
    @page { size: ${paper.width} ${paper.height}; margin: 5mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: ${paper.fontSize}; padding: ${paper.padding}; max-width: ${paper.width}; margin: 0 auto; color: #333; }
    @media print { body { padding: 10px; max-width: 100%; } }
  `;
}

export function getWindowSize(size = 'A5') {
  return (PAPER_SIZES[size] || PAPER_SIZES.A5).windowSize;
}

export function getFontSize(size = 'A5') {
  return (PAPER_SIZES[size] || PAPER_SIZES.A5).fontSize;
}

export function getScaledFontSize(size = 'A5', baseSize = 12) {
  const scales = { A4: 1, A5: 0.9, Thermal: 0.7 };
  const scale = scales[size] || 0.9;
  return Math.round(baseSize * scale) + 'px';
}

export { PAPER_SIZES };
export default PAPER_SIZES;
