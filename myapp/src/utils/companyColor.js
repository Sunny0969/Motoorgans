export function vbColorToHex(color) {
  let n = parseInt(color, 10);
  if (Number.isNaN(n)) return '#cccccc';
  n >>>= 0;
  const r = n & 0xff;
  const g = (n >> 8) & 0xff;
  const b = (n >> 16) & 0xff;
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

export function hexToVbColor(hex) {
  const h = (hex || '#000000').replace('#', '');
  if (h.length !== 6) return 0;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return r + g * 256 + b * 65536;
}

export function companyKey(name) {
  return (name || '').trim().toUpperCase();
}

export function textColorForBg(hex) {
  const h = (hex || '#ffffff').replace('#', '');
  if (h.length !== 6) return '#000';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#000' : '#fff';
}

export function companyColorStyle(companyName, colorMap) {
  const vb = colorMap?.[companyKey(companyName)];
  if (vb == null) return null;
  const hex = vbColorToHex(vb);
  return {
    backgroundColor: hex,
    color: textColorForBg(hex),
    fontWeight: '600',
  };
}
