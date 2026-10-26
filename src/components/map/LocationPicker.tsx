'use client';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MUNICIPALITY_OFFICE } from '@/lib/constants';
import { Search, Navigation, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

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
  useMapEvents({
    click(e) {
      if (!isLocked) setPosition(e.latlng);
    },
  });

  return position ? (
    <Marker
      position={position}
      icon={customIcon}
      draggable={!isLocked}
      eventHandlers={{
        dragend(e) {
          if (!isLocked) setPosition(e.target.getLatLng());
        },
      }}
    />
  ) : null;
}

function MapController({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  map.flyTo([center.lat, center.lng], 16);
  return null;
}

export default function LocationPicker({ position, setPosition, isLocked = false }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // 👇 ฟังก์ชันนี้จะถูกเรียกเมื่อกด Enter ในช่องค้นหา 👇
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const newPos = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setPosition(newPos);
        toast.success('พบสถานที่ที่ค้นหา');
      } else {
        toast.error('ไม่พบสถานที่นี้ กรุณาลองพิมพ์ชื่อใหม่');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      return toast.error('อุปกรณ์ของคุณไม่รองรับการระบุตำแหน่ง');
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
        toast.success('ดึงพิกัดปัจจุบันสำเร็จ');
      },
      (error) => {
        setIsLocating(false);
        toast.error('ไม่สามารถดึงพิกัดได้ กรุณาเปิด GPS และอนุญาตการเข้าถึงตำแหน่ง');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-slate-200 z-0">
      
      {!isLocked && (
        <div className="absolute top-2 left-2 right-2 z-[1000] flex gap-2">
          {/* 👇 แถบค้นหา (ใช้ Enter ในการค้นหา) 👇 */}
          <form onSubmit={handleSearch} className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาสถานที่... (กด Enter)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-white/40 outline-none text-sm focus:border-pink-400 transition-colors"
            />
            {/* 👇 ไอคอนโหลด (แสดงเมื่อกำลังค้นหา) 👇 */}
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
              </div>
            )}
          </form>
          
          {/* ปุ่ม GPS */}
          <button
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="bg-sky-500 hover:bg-sky-600 text-white p-2.5 rounded-xl shadow-md flex items-center justify-center transition-colors disabled:opacity-50 shrink-0"
            title="ดึงพิกัดปัจจุบัน (GPS)"
          >
            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
          </button>
        </div>
      )}

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
        <MapController center={position} />
        <LocationMarker position={position} setPosition={setPosition} isLocked={isLocked} />
      </MapContainer>
      
      <div className={`absolute bottom-2 left-2 right-2 text-xs text-center py-1.5 rounded-lg backdrop-blur z-[1000] shadow-sm font-medium flex items-center justify-center gap-1.5
        ${isLocked ? 'bg-red-50/90 text-red-600' : 'bg-white/90 text-slate-600'}`}>
        {isLocked ? (
          <><Lock className="w-3.5 h-3.5" /> พิกัดถูกล็อค (เนื่องจากมีข้อมูลเดิมแล้ว)</>
        ) : (
          'แตะบนแผนที่เพื่อปักหมุด หรือลากหมุดเพื่อปรับตำแหน่ง'
        )}
      </div>
    </div>
  );
}