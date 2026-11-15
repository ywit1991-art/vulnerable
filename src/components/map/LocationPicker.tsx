// components/map/LocationPicker.tsx
'use client';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MUNICIPALITY_OFFICE } from '@/lib/constants';
import { Search, Navigation, Loader2, Lock, Maximize, Minimize } from 'lucide-react';
import { toast } from 'sonner';

const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="position: relative; width: 40px; height: 48px; filter: drop-shadow(0px 10px 8px rgba(0,0,0,0.5)); animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EC4899" stroke="#ffffff" stroke-width="1.5" style="width: 100%; height: 100%;">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
    <style>
      @keyframes bounceIn {
        0% { transform: translateY(-20px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
    </style>
  `,
  iconSize: [40, 48],
  iconAnchor: [20, 48], // 👈 ชี้ที่ปลายหมุดด้านล่างสุด
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

// 👇 Component สำหรับสั่งให้แผนที่รีไซส์เมื่อเปิด/ปิดเต็มจอ 👇
function MapResizer({ isFullScreen }: { isFullScreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    // หน่วงเวลาเล็กน้อยให้ CSS เปลี่ยนขนาดเสร็จก่อน แล้วค่อยสั่งวาดแผนที่ใหม่
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [isFullScreen, map]);
  return null;
}

function MapController({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  map.flyTo([center.lat, center.lng], 18, { duration: 1.5 });
  return null;
}

export default function LocationPicker({ position, setPosition, isLocked = false }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  // 👇 State สำหรับการขยายเต็มหน้าจอ 👇
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  // กำหนด Class สำหรับ Container หลัก ตามสถานะ Fullscreen
  const containerClass = isFullScreen 
    ? "fixed inset-0 z-[9999] w-screen h-screen bg-white" 
    : "relative w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden border border-slate-200 z-0";

  return (
    <div className={containerClass}>
      
      {!isLocked && (
        <div className="absolute top-2 left-2 right-2 z-[1000] flex gap-2">
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
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
              </div>
            )}
          </form>
          
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="bg-sky-500 hover:bg-sky-600 text-white p-2.5 rounded-xl shadow-md flex items-center justify-center transition-colors disabled:opacity-50 shrink-0"
            title="ดึงพิกัดปัจจุบัน (GPS)"
          >
            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
          </button>

          {/* 👇 ปุ่มขยายเต็มหน้าจอ 👇 */}
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-xl shadow-md flex items-center justify-center transition-colors shrink-0"
            title={isFullScreen ? "ย่อหน้าจอ" : "ขยายเต็มหน้าจอ"}
          >
            {isFullScreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      )}

      <MapContainer
        center={position.lat ? [position.lat, position.lng] : [MUNICIPALITY_OFFICE.lat, MUNICIPALITY_OFFICE.lng]}
        zoom={18}
        className="w-full h-full z-0"
        scrollWheelZoom={!isLocked}
        dragging={!isLocked}
      >
        <LayersControl position="bottomleft">
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

        <MapResizer isFullScreen={isFullScreen} />
        <MapController center={position} />
        <LocationMarker position={position} setPosition={setPosition} isLocked={isLocked} />
      </MapContainer>
      
      {!isFullScreen && (
        <div className={`absolute bottom-2 left-2 right-2 text-xs text-center py-1.5 rounded-lg backdrop-blur z-[1000] shadow-sm font-medium flex items-center justify-center gap-1.5
          ${isLocked ? 'bg-red-50/90 text-red-600' : 'bg-white/90 text-slate-600'}`}>
          {isLocked ? (
            <><Lock className="w-3.5 h-3.5" /> พิกัดถูกล็อค (เนื่องจากมีข้อมูลเดิมแล้ว)</>
          ) : (
            'ลากหมุด หรือคลิกบนแผนที่เพื่อระบุตำแหน่งบ้าน'
          )}
        </div>
      )}

      {/* แสดงข้อความบอกใบ้ตอนเต็มจอ (มุมขวาล่าง) */}
      {isFullScreen && !isLocked && (
        <div className="absolute bottom-6 right-6 text-sm bg-slate-800/90 text-white px-4 py-2 rounded-xl shadow-lg z-[1000] pointer-events-none">
          คลิกบนแผนที่เพื่อปักหมุด
        </div>
      )}
    </div>
  );
}