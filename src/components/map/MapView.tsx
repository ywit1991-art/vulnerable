// src/components/map/MapView.tsx
'use client';
import { MapContainer, TileLayer, Marker, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { buildMarkerIcon } from './MarkerIcon';
import { MUNICIPALITY_OFFICE } from '@/lib/constants';
import { useEffect } from 'react';
import L from 'leaflet';

interface Props {
  persons: any[];
  onSelect: (p: any) => void;
}

function FitBounds({ persons }: { persons: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (persons.length > 0) {
      const validPersons = persons.filter(p => p.latitude && p.longitude);
      if (validPersons.length > 0) {
        const bounds = L.latLngBounds(validPersons.map(p => [p.latitude, p.longitude]));
        
        // 👇 1. ปรับ Padding: บน 150px เพื่อเผื่อที่ให้แถบค้นหา, ล่าง-ซ้าย-ขวา 50px 👇
        map.fitBounds(bounds, { 
          paddingTopLeft: [50, 150], 
          paddingBottomRight: [50, 50], 
          maxZoom: 16 
        }); 
      }
    }
  }, [persons, map]);
  return null;
}

// 👇 2. ขยาย Bounds ให้ขึ้นไปทางเหนือได้ไกลขึ้น (ละติจูดตัวที่ 2 เพิ่มขึ้น) 👇
const THAWANGTHONG_BOUNDS: L.LatLngBoundsExpression = [
  [19.100, 99.800], // มุมล่างซ้าย (ตะวันตกเฉียงใต้) - ขยายลงมาเล็กน้อย
  [19.320, 100.000] // มุมบนขวา (ตะวันออกเฉียงเหนือ) - ขยายขึ้นไปทางเหนือเยอะๆ
];

export default function MapView({ persons, onSelect }: Props) {
  return (
    <div className="absolute inset-0">
      <MapContainer
        // 👇 3. ขยับจุด Center เริ่มต้นให้สูงขึ้น (เหนือขึ้น) 👇
        center={[19.2000, 99.9000]} 
        zoom={14}
        minZoom={11} 
        maxBounds={THAWANGTHONG_BOUNDS} 
        maxBoundsViscosity={0.8} // ลดความหนืดลงนิดนึงให้ลากได้ลื่นขึ้น
        zoomControl={false}
        className="w-full h-full"
      >
        <LayersControl position="bottomright">
          <LayersControl.BaseLayer checked name="ดาวเทียม">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="แผนที่ถนน">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <FitBounds persons={persons} />

        {persons
          .filter(p => p.latitude != null && p.longitude != null)
          .map((p) => (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
              icon={buildMarkerIcon(p.vulnerabilities)} 
              eventHandlers={{ click: () => onSelect(p) }}
            />
        ))}
      </MapContainer>
    </div>
  );
}