'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ฟังก์ชันซูมให้พอดีกับขอบเขตตำบล
function FitBounds({ data }: { data: any }) {
  const map = useMap();
  useEffect(() => {
    if (data) {
      const bounds = L.geoJSON(data).getBounds();
      
      // 👇 ปรับค่านี้เพื่อให้แผนที่ซูมเข้าใกล้ขึ้น 👇
      map.fitBounds(bounds, { 
        padding: [10, 10], 
        maxZoom: 14 
      }); 
      
      map.setMaxBounds(bounds);
    }
  }, [data, map]);
  return null;
}

export default function PublicMap({ villages }: { villages: any[] }) {
  const [geoData, setGeoData] = useState<any>(null);
  const [maskPositions, setMaskPositions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/thawangthong.geojson')
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);

        // 👇 สร้างพิกัดสำหรับ "หน้ากากสีขาว" 👇
        if (data.features && data.features[0].geometry.type === 'Polygon') {
          // 1. ดึงพิกัดเส้นขอบตำบล (สลับ lat/lng)
          const coords = data.features[0].geometry.coordinates[0];
          const innerRing = coords.map((c: any) => [c[1], c[0]]);
          
          // 2. สร้างกรอบสี่เหลี่ยมขนาดใหญ่ครอบโลก
          const outerRing = [
            [90, -180], [90, 180], [-90, 180], [-90, -180]
          ];
          
          // 3. รวมกันเป็น Polygon ที่มีรูตรงกลาง
          setMaskPositions([outerRing, innerRing]);
        }
      })
      .catch((err) => console.error('ไม่พบไฟล์ geojson:', err));
  }, []);

  // ตั้งค่าสีพื้นที่ตำบล (ชมพูอ่อน ขอบฟ้า)
  const getStyle = () => {
    return {
      fillColor: '#FCE7F3', 
      weight: 3,            
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
            
            {/* 👇 1. วาดหน้ากากสีขาวคลุมรอบนอก (เจาะรูตรงกลาง) 👇 */}
            {maskPositions.length > 0 && (
              <Polygon 
                positions={maskPositions} 
                pathOptions={{ 
                  color: 'white', 
                  fillColor: 'white', 
                  fillOpacity: 1, // ทึบ 100%
                  weight: 0,      // ไม่ต้องมีเส้นขอบ
                  interactive: false,
                  fillRule: 'evenodd' // 👈 สั่งให้ตรงกลางเป็นรูโปร่งใส
                }} 
              />
            )}

            {/* 👇 2. วาดพื้นที่ตำบล (สีชมพู ขอบฟ้า) ทับลงไป 👇 */}
            <GeoJSON
              data={geoData}
              style={getStyle}
              interactive={false} 
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}