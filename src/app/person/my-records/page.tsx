'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, MapPin, Edit, ArrowLeft, Loader2, User, Plus, History, LogOut } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { VULN, type VulnType } from '@/lib/constants';
import type { Person } from '@/types';
import InterventionModal from '@/components/form/InterventionModal';
import InterventionHistoryModal from '@/components/form/InterventionHistoryModal';

export default function MyRecordsPage() {
  const router = useRouter();
  const [staffCode, setStaffCode] = useState<string | null>(null);
  const [records, setRecords] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [historyPerson, setHistoryPerson] = useState<Person | null>(null);

  useEffect(() => {
    const code = sessionStorage.getItem('staff_code');
    const role = sessionStorage.getItem('staff_role');
    if (!code || role !== 'OSM') {
      router.replace('/login');
      return;
    }
    setStaffCode(code);
    fetchMyRecords(code);
  }, [router]);

  const fetchMyRecords = async (code: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase()
        .from('vulnerable_persons')
        .select('*, interventions(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRecords(data as any);
        
        if (historyPerson) {
          const updatedPerson = data.find((p: any) => p.id === historyPerson.id);
          if (updatedPerson) setHistoryPerson(updatedPerson);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase().trim());
  });

  return (
    <main className="min-h-screen bg-gradient-soft pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-[100] bg-white/90 backdrop-blur-xl border-b border-white/60">
        <div className="max-w-4xl mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button onClick={() => router.push('/person/new')} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-sm border border-slate-100 p-0.5 shrink-0 hidden sm:block">
               <Image src="/logo.png" alt="logo" width={40} height={40} className="object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 text-sm md:text-lg truncate">รายการข้อมูลของฉัน</h1>
              <p className="text-[10px] md:text-[11px] text-pink-600 font-medium flex items-center gap-1 truncate mt-0.5">
                <User className="w-3 h-3 shrink-0" /> <span className="truncate">เจ้าหน้าที่: {staffCode}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <button 
              onClick={() => router.push('/person/new')} 
              className="flex items-center gap-1.5 px-3 py-1.5 md:py-2 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-xl text-xs md:text-sm font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">เพิ่มข้อมูลใหม่</span>
            </button>
             <button 
              onClick={() => { sessionStorage.clear(); router.replace('/'); }} 
              className="flex items-center gap-1.5 px-3 py-1.5 md:py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs md:text-sm font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 mt-2">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือนามสกุล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all text-sm shadow-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-20 h-20 mb-4 animate-bounce">
              <Image src="/logo.png" alt="Logo" fill className="object-contain drop-shadow-xl" />
            </div>
            <div className="flex items-center gap-2 text-pink-500 font-medium">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="text-5xl mb-4">📂</div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">ไม่พบข้อมูล</h3>
            <p className="text-slate-500 text-sm mb-6">คุณยังไม่ได้บันทึกข้อมูล หรือค้นหาไม่พบ</p>
            <button onClick={() => router.push('/person/new')} className="bg-pink-500 text-white px-6 py-2.5 rounded-xl font-medium shadow-glow hover:scale-105 transition-transform">
              + เพิ่มข้อมูลใหม่
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 font-medium mb-2">พบทั้งหมด {filteredRecords.length} รายการ</p>
            {filteredRecords.map((person, index) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-3xl p-5 shadow-soft border border-white/60 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {person.prefix}{person.first_name} {person.last_name}
                    </h3>
                    {person.birth_date && (
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        อายุ {new Date().getFullYear() - new Date(person.birth_date).getFullYear()} ปี
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {person.vulnerabilities.map((v) => (
                      <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-white" style={{ backgroundColor: VULN[v as VulnType]?.color || '#94a3b8' }}>
                        {VULN[v as VulnType]?.emoji} {VULN[v as VulnType]?.label || v}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {person.note || 'ไม่ระบุที่อยู่'}
                    </p>
                    {person.phone && (
                      <p className="flex items-center gap-2">
                        <span className="w-4 h-4 flex items-center justify-center text-slate-400 text-xs">📞</span>
                        {person.phone}
                      </p>
                    )}
                    {person.interventions && person.interventions.length > 0 && (
                      <p className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md inline-block mt-2 font-medium">
                        ✅ ได้รับการช่วยเหลือแล้ว {person.interventions.length} ครั้ง
                      </p>
                    )}
                  </div>
                </div>

                {/* 👇 ปุ่มจัดการ (แสดงข้อความบนจอคอม) 👇 */}
                <div className="w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5 flex flex-col sm:flex-row gap-2">
                  {person.interventions && person.interventions.length > 0 && (
                    <button
                      onClick={() => setHistoryPerson(person)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium text-sm transition-colors"
                    >
                      <History className="w-4 h-4 shrink-0" /> 
                      <span className="hidden md:inline">ประวัติ</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setSelectedPerson(person)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-xl font-medium text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4 shrink-0" /> 
                    <span className="hidden md:inline">ช่วยเหลือ</span>
                  </button>
                  
                  <button
                    onClick={() => router.push(`/person/edit/${person.id}`)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-xl font-medium text-sm transition-colors"
                  >
                    <Edit className="w-4 h-4 shrink-0" /> 
                    <span className="hidden md:inline">แก้ไข</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selectedPerson && (
        <InterventionModal
          personId={selectedPerson.id}
          personName={`${selectedPerson.prefix || ''}${selectedPerson.first_name} ${selectedPerson.last_name}`}
          staffCode={staffCode || ''}
          onClose={() => setSelectedPerson(null)}
          onSuccess={() => fetchMyRecords(staffCode || '')}
        />
      )}

      {historyPerson && (
        <InterventionHistoryModal
          person={historyPerson}
          staffCode={staffCode || ''}
          onClose={() => setHistoryPerson(null)}
          onRefresh={() => fetchMyRecords(staffCode || '')}
        />
      )}
    </main>
  );
}