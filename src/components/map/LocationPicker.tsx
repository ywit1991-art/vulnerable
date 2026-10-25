'use client';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MUNICIPALITY_OFFICE } from '@/lib/constants';
import { Lock } from 'lucide-react';

const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      background-color: #EC4899; 
      width: 24px; 
      height: 24px; 
      border-radius: 50%; 
      border: 4px solid white; 
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div style="
        position: absolute; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%); 
        width: 8px; 
        height: 8px; 
        background-color: white; 
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface Props {
  position: { lat: number; lng: number };
  setPosition: (pos: { lat: number; lng: number }) => void;
  isLocked?: boolean;
}

function LocationMarker({ position, setPosition, isLocked }: Props) {
  // ดักจับการคลิกแผนที่
  useMapEvents({
    click(e) {
      if (!isLocked) {
        setPosition(e.latlng);
      }
    },
  });

  return position ? (
    <Marker
      position={position}
      icon={customIcon}
      draggable={!isLocked} // 👈 ส่ง draggable=false เมื่อล็อค
      eventHandlers={{
        dragend(e) {
          if (!isLocked) {
            setPosition(e.target.getLatLng());
          }
        },
      }}
    />
  ) : null;
}

export default function LocationPicker({ position, setPosition, isLocked = false }: Props) {
  return (
    <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-200 z-0 relative">
      <MapContainer
        center={position.lat ? [position.lat, position.lng] : [MUNICIPALITY_OFFICE.lat, MUNICIPALITY_OFFICE.lng]}
        zoom={15}
        className="w-full h-full z-0"
        scrollWheelZoom={!isLocked} 
        dragging={!isLocked}        
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <LocationMarker position={position} setPosition={setPosition} isLocked={isLocked} />
      </MapContainer>
      
      {/* แถบข้อความด้านล่าง */}
      <div className={`absolute bottom-2 left-2 right-2 text-xs text-center py-1.5 rounded-lg backdrop-blur z-[1000] shadow-sm font-medium flex items-center justify-center gap-1.5
        ${isLocked ? 'bg-red-50/90 text-red-600' : 'bg-white/90 text-slate-600'}`}>
        {isLocked ? (
          <>
            <Lock className="w-3.5 h-3.5" /> พิกัดถูกล็อค (เนื่องจากมีข้อมูลเดิมแล้ว)
          </>
        ) : (
          'แตะบนแผนที่เพื่อปักหมุด หรือลากหมุดเพื่อปรับตำแหน่ง'
        )}
      </div>
    </div>
  );
}