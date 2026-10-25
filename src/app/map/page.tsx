'use client';
import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/ui/Navbar';
import { checkAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import { Search, Filter, MapPin, X, Phone, FileText, RotateCcw, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { VULN, type VulnType } from '@/lib/constants';
import { useRouter } from 'next/navigation';

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false });

export default function StaffMapPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [persons, setPersons] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [village, setVillage] = useState('ALL');
  const [type, setType] = useState('ALL');
  
  // 👇 State สำหรับเปิด/ปิดแถบตัวกรองบนมือถือ 👇
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const auth = checkAuth(['MUNICIPALITY', 'OSM']);
    if (!auth) { window.location.href = '/login'; return; }
    setUser(auth);

    const fetchPersons = async () => {
      const { data } = await supabase().from('vulnerable_persons').select('*, interventions(*)');
      if (data) setPersons(data);
    };
    fetchPersons();
  }, []);

  const filteredPersons = useMemo(() => {
    return persons.filter(p => {
      const matchSearch = `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase());
      const matchVillage = village === 'ALL' || p.note?.includes(`หมู่ที่ ${village}`) || p.note?.includes(`หมู่ ${village}`);
      const matchType = type === 'ALL' || p.vulnerabilities?.includes(type);
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
      
      {/* แสดงจำนวนข้อมูล */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg pointer-events-none">
        พบข้อมูลบนแผนที่: {filteredPersons.length} ราย
      </div>

      {/* 👇 แถบเครื่องมือลอย (Floating Toolbar) 👇 */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-2 md:p-4 pointer-events-none">
        <div className="max-w-[1200px] mx-auto pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 overflow-hidden transition-all duration-300">
          
          {/* แถวที่ 1: ช่องค้นหา และปุ่มเปิดตัวกรอง (มือถือ) */}
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
            
            {/* ปุ่มเปิดตัวกรอง (แสดงเฉพาะมือถือ) */}
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)} 
              className={`md:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isFilterOpen ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-600'}`}
            >
              <Filter className="w-4 h-4" /> 
              <ChevronDown className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* ปุ่มจัดการ (แสดงเฉพาะคอมพิวเตอร์) */}
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
              <button onClick={handleClearFilters} className="bg-slate-100 text-slate-600 hover:bg-slate-200 p-2.5 rounded-xl transition-colors" title="ล้างตัวกรอง">
                <RotateCcw className="w-4 h-4" />
              </button>
              <Link href="/municipality/report" className="bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-900 transition-colors">
                <Filter className="w-4 h-4" /> รายงานสถิติ
              </Link>
              <button onClick={handleLogout} className="bg-red-50 text-red-600 hover:bg-red-100 p-2.5 rounded-xl transition-colors" title="ออกจากระบบ">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 👇 แถวที่ 2: ตัวกรอง (แสดงเฉพาะเมื่อกดเปิดบนมือถือ) 👇 */}
          <div className={`md:hidden px-2 pb-2 space-y-2 overflow-hidden transition-all ${isFilterOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <select value={village} onChange={e => setVillage(e.target.value)} className="w-full bg-slate-100 text-sm font-medium rounded-xl px-3 py-2.5 outline-none">
              <option value="ALL">ทุกหมู่บ้าน</option>
              {Array.from({ length: 14 }).map((_, i) => <option key={i+1} value={i+1}>หมู่ {i+1}</option>)}
            </select>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-100 text-sm font-medium rounded-xl px-3 py-2.5 outline-none">
              <option value="ALL">ทุกประเภท</option>
              {Object.entries(VULN).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={handleClearFilters} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-medium flex justify-center items-center gap-2">
                <RotateCcw className="w-4 h-4" /> ล้างค่า
              </button>
              <Link href="/municipality/report" className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2">
                <Filter className="w-4 h-4" /> รายงาน
              </Link>
              <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium flex justify-center items-center gap-2">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      <MapView persons={filteredPersons} onSelect={setSelected} />

      {/* Popup Modal รายละเอียด (เหมือนเดิม) */}
      {selected && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative animate-slide-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            
            <div className="p-6 overflow-y-auto">
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors z-10"><X className="w-4 h-4" /></button>
              
              <h3 className="text-xl font-bold text-slate-800 pr-8">{selected.prefix}{selected.first_name} {selected.last_name}</h3>
              
              <div className="flex flex-wrap gap-1 mt-2 mb-4">
                {selected.vulnerabilities?.map((v: string) => (
                  <span key={v} className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ backgroundColor: VULN[v as VulnType]?.color }}>{VULN[v as VulnType]?.label}</span>
                ))}
              </div>

              <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl mb-4">
                <p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" /> {selected.note || 'ไม่ระบุที่อยู่'}</p>
                {selected.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {selected.phone}</p>}
              </div>

              <button onClick={() => window.open(`/person/${selected.id}/print`, '_blank')} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-slate-900 transition-colors">
                <FileText className="w-5 h-5" /> ดูข้อมูล / พิมพ์เอกสาร
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}