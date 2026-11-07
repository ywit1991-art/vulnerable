'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function FitBounds({ data }: { data: any }) {
  const map = useMap();
  useEffect(() => {
    // 👇 หน่วงเวลาเล็กน้อยให้ Container วาดเสร็จก่อน แล้วค่อยสั่งซูม 👇
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (data) {
        const bounds = L.geoJSON(data).getBounds();
        map.fitBounds(bounds, { padding: [10, 10], maxZoom: 14 }); 
        map.setMaxBounds(bounds);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [data, map]);
  return null;
}

export default function PublicMap({ villages }: { villages: any[] }) {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch('/thawangthong.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('ไม่พบไฟล์ geojson:', err));
  }, []);

  const getStyle = () => {
    return {
      fillColor: '#FCE7F3', 
      weight: 1.5,          
      opacity: 1,
      color: '#0EA5E9',     
      fillOpacity: 0.7,     
    };
  };

  return (
    <div className="w-full h-full relative z-0 bg-white">
      <MapContainer
        center={[19.1750, 99.9150]}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
        dragging={false}          
        scrollWheelZoom={false}   
        doubleClickZoom={false}   
        touchZoom={false}         
        boxZoom={false}
        keyboard={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {geoData && (
          <>
            <FitBounds data={geoData} />
            <GeoJSON data={geoData} style={getStyle} interactive={false} />
          </>
        )}
      </MapContainer>
    </div>
  );
}