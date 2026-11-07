import L from 'leaflet';
import { VULN, type VulnType } from '@/lib/constants';

export function buildMarkerIcon(vuln: VulnType[], isActive = false): L.DivIcon {
  const safeVuln = Array.isArray(vuln) ? vuln : [];
  const colors = safeVuln.map((v) => VULN[v]?.color || '#94A3B8'); 

  let background = '#94A3B8'; 
  if (colors.length > 0) {
    if (colors.length === 1) {
      background = colors[0]; 
    } else {
      const gradientStops = colors.map((color, index) => {
        const startPercent = (index * 100) / colors.length;
        const endPercent = ((index + 1) * 100) / colors.length;
        return `${color} ${startPercent}% ${endPercent}%`;
      }).join(', ');
      background = `conic-gradient(${gradientStops})`;
    }
  }

  // 👇 เปลี่ยน HTML ให้เป็นวงกลมเรียบๆ 👇
  return L.divIcon({
    className: `custom-marker ${isActive ? 'active' : ''}`,
    html: `
      <div style="
        background: ${background};
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      "></div>
    `,
    iconSize: [28, 28], // ขนาดวงกลม
    iconAnchor: [14, 14], // จุดกึ่งกลางวงกลม
  });
}