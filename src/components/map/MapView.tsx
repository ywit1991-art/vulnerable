'use client';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
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
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [persons, map]);
  return null;
}

// 👇 พิกัดขอบเขตตำบลท่าวังทอง (โดยประมาณ) 👇
const THAWANGTHONG_BOUNDS: L.LatLngBoundsExpression = [
  [19.130, 99.850], // ตะวันตกเฉียงใต้ (South-West)
  [19.250, 99.960]  // ตะวันออกเฉียงเหนือ (North-East)
];

export default function MapView({ persons, onSelect }: Props) {
  return (
    <div className="absolute inset-0">
      <MapContainer
        center={[MUNICIPALITY_OFFICE.lat, MUNICIPALITY_OFFICE.lng]}
        zoom={13}
        minZoom={11} // 👈 ล็อคไม่ให้ซูมออกไกลกว่าระดับ 11
        maxBounds={THAWANGTHONG_BOUNDS} // 👈 ล็อคไม่ให้ลากออกนอกตำบล
        maxBoundsViscosity={1.0} // 👈 บังคับให้แผนที่เด้งกลับมาเมื่อลากออกนอกขอบเขต
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />

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