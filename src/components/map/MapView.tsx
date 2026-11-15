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
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 }); // 👈 เพิ่ม maxZoom เป็น 18 เพื่อซูมชิดขึ้น
      }
    }
  }, [persons, map]);
  return null;
}

const THAWANGTHONG_BOUNDS: L.LatLngBoundsExpression = [
  [19.130, 99.850], 
  [19.250, 99.960]  
];

export default function MapView({ persons, onSelect }: Props) {
  return (
    <div className="absolute inset-0">
      <MapContainer
        center={[MUNICIPALITY_OFFICE.lat, MUNICIPALITY_OFFICE.lng]}
        zoom={16} // 👈 ซูมเริ่มต้นให้ชัดขึ้น
        minZoom={11}
        maxBounds={THAWANGTHONG_BOUNDS}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        className="w-full h-full"
      >
        {/* 👇 เพิ่ม LayersControl เพื่อให้สลับแผนที่ได้ 👇 */}
        <LayersControl position="bottomright">
          
          <LayersControl.BaseLayer checked name="ดาวเทียม (เห็นหลังคาบ้าน)">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="แผนที่ถนนปกติ">
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