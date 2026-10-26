'use client';
import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/ui/Navbar';
import { checkAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import { Search, Filter, MapPin, X, Phone, FileText, RotateCcw, LogOut, ChevronDown, Users } from 'lucide-react';
import Link from 'next/link';
import { VULN, type VulnType } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false });

const formatPhone = (phone: string) => {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  return phone; 
};

export default function StaffMapPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [persons, setPersons] = useState<any[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<any>(null); 
  const [selectedImage, setSelectedImage] = useState<string | null>(null); 
  
  const [search, setSearch] = useState('');
  const [village, setVillage] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const auth = checkAuth(['MUNICIPALITY', 'OSM']);
    if (!auth) { window.location.href = '/login'; return; }
    setUser(auth);

    const fetchPersons = async () => {
      const { data } = await supabase().from('vulnerable_persons').select('*, interventions(*)');
      const { data: registryData } = await supabase().from('registry_persons').select('national_id, house_code, house_no, village_no');
      
      if (data && registryData) {
        const householdsMap = new Map();

        data.forEach((p: any) => {
          const cleanId = String(p.national_id).replace(/\D/g, '');
          const regInfo = registryData.find((r: any) => String(r.national_id).replace(/\D/g, '') === cleanId);
          
          let houseKey = regInfo?.house_code ? String(regInfo.house_code).trim() : '';
          if (!houseKey) houseKey = regInfo?.house_no ? String(regInfo.house_no).trim() : p.national_id;

          if (!householdsMap.has(houseKey)) {
            householdsMap.set(houseKey, {
              id: houseKey,
              house_no: regInfo?.house_no || '-',
              village_no: regInfo?.village_no || '-',
              latitude: p.latitude,
              longitude: p.longitude,
              vulnerabilities: new Set(p.vulnerabilities || []),
              persons: [p], 
              interventions: [...(p.interventions || [])]
            });
          } else {
            const existing = householdsMap.get(houseKey);
            (p.vulnerabilities || []).forEach((v: string) => existing.vulnerabilities.add(v));
            existing.persons.push(p);
            if (p.interventions) existing.interventions.push(...p.interventions);
          }
        });

        const formattedHouseholds = Array.from(householdsMap.values()).map((h: any) => ({
          ...h,
          vulnerabilities: Array.from(h.vulnerabilities)
        }));

        setPersons(formattedHouseholds);
      }
    };
    fetchPersons();
  }, []);

  const filteredPersons = useMemo(() => {
    return persons.filter((h: any) => {
      const matchSearch = h.persons.some((p: any) => 
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
      );
      const matchVillage = village === 'ALL' || String(h.village_no) === String(village);
      const matchType = type === 'ALL' || h.vulnerabilities.includes(type);
      return matchSearch && matchVillage && matchType;
    });
  }, [persons, search, village, type]);

  const handleClearFilters = () => {
    setSearch('');
    setVillage('ALL');
    setType('ALL');
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/';
  };

  if (!user) return null;

  return (
    <main className="h-screen w-screen overflow-hidden relative bg-slate-50">
      
      <div className="absolute bottom-4 left-4 z-[1000] bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg pointer-events-none">
        พบข้อมูลบนแผนที่: {filteredPersons.length} ครัวเรือน
      </div>

      <div className="absolute top-0 left-0 right-0 z-[1000] p-2 md:p-4 pointer-events-none">
        <div className="max-w-[1200px] mx-auto pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 overflow-hidden transition-all duration-300">
          
          <div className="flex items-center gap-2 p-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2.5">
              <Search className="w-4 h-4 text-pink-500 shrink-0" />
              <input type="text" placeholder="ค้นหาชื่อ..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent outline-none text-sm w-full" />
              {search && (
                <button onClick={() => setSearch('')} className="p-1 hover:bg-slate-200 rounded-full text-slate-400">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)} 
              className={`md:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isFilterOpen ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-600'}`}
            >
              <Filter className="w-4 h-4" /> 
              <ChevronDown className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className="hidden md:flex items-center gap-2">
              <select value={village} onChange={e => setVillage(e.target.value)} className="bg-slate-100 text-sm font-medium rounded-xl px-3 py-2.5 outline-none cursor-pointer hover:bg-slate-200 transition-colors">
                <option value="ALL">ทุกหมู่บ้าน</option>
                {Array.from({ length: 14 }).map((_, i) => <option key={i+1} value={i+1}>หมู่ {i+1}</option>)}
              </select>
              <select value={type} onChange={e => setType(e.target.value)} className="bg-slate-100 text-sm font-medium rounded-xl px-3 py-2.5 outline-none cursor-pointer hover:bg-slate-200 transition-colors">
                <option value="ALL">ทุกประเภท</option>
                {Object.entries(VULN).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              
              <button onClick={handleClearFilters} className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors" title="ล้างตัวกรอง">
                <RotateCcw className="w-4 h-4" /> <span>ล้างค่า</span>
              </button>
              
              <Link href="/municipality/report" className="bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-900 transition-colors">
                <Filter className="w-4 h-4" /> <span>รายงานสถิติ</span>
              </Link>
              
              <button onClick={handleLogout} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors" title="ออกจากระบบ">
                <LogOut className="w-4 h-4" /> <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>

          <div className={`md:hidden px-2 pb-2 overflow-hidden transition-all ${isFilterOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="flex gap-2 mb-2">
              <select value={village} onChange={e => setVillage(e.target.value)} className="flex-1 w-full bg-slate-100 text-xs font-medium rounded-xl px-2 py-2.5 outline-none">
                <option value="ALL">ทุกหมู่บ้าน</option>
                {Array.from({ length: 14 }).map((_, i) => <option key={i+1} value={i+1}>หมู่ {i+1}</option>)}
              </select>
              <select value={type} onChange={e => setType(e.target.value)} className="flex-1 w-full bg-slate-100 text-xs font-medium rounded-xl px-2 py-2.5 outline-none">
                <option value="ALL">ทุกประเภท</option>
                {Object.entries(VULN).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div className="flex gap-2">
              <button onClick={handleClearFilters} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs font-medium flex justify-center items-center gap-1.5">
                <RotateCcw className="w-4 h-4" /> ล้างค่า
              </button>
              <Link href="/municipality/report" className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-1.5">
                <Filter className="w-4 h-4" /> รายงานสถิติ
              </Link>
              <button onClick={handleLogout} className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-xs font-medium flex justify-center items-center gap-1.5">
                <LogOut className="w-4 h-4" /> ออกจากระบบ
              </button>
            </div>
          </div>

        </div>
      </div>

      <MapView persons={filteredPersons} onSelect={setSelectedHouse} />

      {/* Popup Modal แสดงรายชื่อคนในครัวเรือน */}
      {selectedHouse && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedHouse(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative animate-slide-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            
            <div className="p-6 overflow-y-auto">
              <button onClick={() => setSelectedHouse(null)} className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors z-10"><X className="w-4 h-4" /></button>
              
              <h3 className="text-xl font-bold text-slate-800 pr-8 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-pink-500" /> 
                บ้านเลขที่ {selectedHouse.house_no} หมู่ {selectedHouse.village_no}
              </h3>
              
              <div className="flex flex-wrap gap-1 mt-2 mb-4">
                {selectedHouse.vulnerabilities.map((v: string) => (
                  <span key={v} className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ backgroundColor: VULN[v as VulnType]?.color }}>
                    {VULN[v as VulnType]?.label}
                  </span>
                ))}
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-sky-500" /> สมาชิกในครัวเรือน ({selectedHouse.persons.length} คน)
                </h4>
                <div className="space-y-3">
                  {selectedHouse.persons.map((p: any) => (
                    <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <p className="font-bold text-slate-800">{p.prefix}{p.first_name} {p.last_name}</p>
                      <div className="flex flex-wrap gap-1 mt-1 mb-2">
                        {p.vulnerabilities?.map((v: string) => (
                          <span key={v} className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: VULN[v as VulnType]?.color }}>
                            {VULN[v as VulnType]?.label}
                          </span>
                        ))}
                      </div>
                      
                      {p.photo_urls && p.photo_urls.length > 0 && (
                        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                          {p.photo_urls
                            .filter((url: string) => url && (url.startsWith('data:image') || url.startsWith('http')))
                            .map((url: string, i: number) => (
                              <div key={i} className="w-24 aspect-[5/4] shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative group cursor-zoom-in">
                                <img 
                                  src={url} 
                                  alt={`photo-${i}`} 
                                  className="w-full h-full object-cover absolute inset-0 z-10 hover:opacity-90 transition-opacity" 
                                  onClick={() => setSelectedImage(url)} 
                                  onError={(e) => {
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) parent.style.display = 'none';
                                  }}
                                />
                              </div>
                          ))}
                        </div>
                      )}

                      {p.phone && <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {formatPhone(p.phone)}</p>}
                      
                      <button onClick={() => window.open(`/person/${p.id}/print`, '_blank')} className="w-full mt-2 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex justify-center items-center gap-2 hover:bg-slate-900 transition-colors">
                        <FileText className="w-4 h-4" /> ดูข้อมูล / พิมพ์เอกสาร
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <p className="text-xs text-slate-400 text-center">พิกัด: {selectedHouse.latitude}, {selectedHouse.longitude}</p>
            </div>

          </div>
        </div>
      )}

      {/* 👇 Image Lightbox Popup (พื้นหลังขาว + ลายน้ำสีแดงจางๆ) 👇 */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            // 👇 เปลี่ยนจาก bg-black/80 เป็น bg-white/90 และเพิ่ม blur 👇
            className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-white/90 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              onClick={() => setSelectedImage(null)} 
              // 👇 ปรับสีปุ่มปิดให้เข้ากับพื้นหลังสว่าง 👇
              className="absolute top-6 right-6 bg-slate-200/50 hover:bg-slate-300/50 p-2 rounded-full text-slate-700 transition-colors z-50 shadow-sm"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div 
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              // 👇 ใส่ padding รอบรูปเพื่อให้ดูเหมือนกรอบรูป 👇
              className="relative max-w-full max-h-[85vh] rounded-xl overflow-hidden shadow-2xl bg-white p-2 border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage} 
                alt="Full size" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              
              {/* 👇 ลายน้ำ (Watermark) สีแดงจางๆ 👇 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden p-4">
                <p 
                  className="text-red-500/30 font-black text-3xl md:text-5xl text-center rotate-[-30deg] tracking-widest uppercase leading-relaxed"
                  style={{ textShadow: '0 2px 10px rgba(255,255,255,0.8)' }} // 👈 เงาสีขาวเพื่อให้อ่านง่ายบนพื้นสว่าง
                >
                  ข้อมูลใช้ในงานราชการ<br className="hidden md:block" />
                  ของเทศบาลตำบลท่าวังทองเท่านั้น
                </p>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}