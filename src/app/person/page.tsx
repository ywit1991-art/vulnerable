'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogIn, Users, ShieldAlert, HeartPulse, UserX } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

import HouseholdBarChart from '@/components/dashboard/HouseholdBarChart';
import AgeBarChart from '@/components/dashboard/AgeBarChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';

const PublicMap = dynamic(() => import('@/components/map/PublicMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">กำลังโหลดแผนที่...</div>
});

export default function HomePage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, elderly: 0, disabled: 0, bedridden: 0, lowIncome: 0, pregnant: 0, pending: 0, overlap: 0, livesAlone: 0 });
  const [villageData, setVillageData] = useState<any[]>([]);
  const [ageData, setAgeData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: vulnerableData } = await supabase().from('vulnerable_persons').select('*');
        const { data: registryData } = await supabase().from('registry_persons').select('national_id, village_no');
        const { data: interventions } = await supabase().from('interventions').select('*');

        if (vulnerableData) {
          const assistedIds = new Set(interventions?.map((i: any) => i.person_id) || []);
          
          const total = vulnerableData.length;
          const elderly = vulnerableData.filter((p: any) => p.vulnerabilities?.includes('ELDERLY')).length;
          const disabled = vulnerableData.filter((p: any) => p.vulnerabilities?.includes('DISABLED')).length;
          const bedridden = vulnerableData.filter((p: any) => p.vulnerabilities?.includes('BEDRIDDEN')).length;
          const lowIncome = vulnerableData.filter((p: any) => p.vulnerabilities?.includes('LOW_INCOME')).length;
          const pregnant = vulnerableData.filter((p: any) => p.vulnerabilities?.includes('PREGNANT')).length;
          
          const pending = vulnerableData.filter((p: any) => !assistedIds.has(p.id)).length;
          const overlap = vulnerableData.filter((p: any) => p.vulnerabilities && p.vulnerabilities.length > 1).length;
          const livesAlone = vulnerableData.filter((p: any) => p.lives_alone === true || p.note?.includes('อยู่คนเดียว')).length;

          setStats({ total, elderly, disabled, bedridden, lowIncome, pregnant, pending, overlap, livesAlone });

          // คำนวณหมู่บ้าน
          const villages = Array.from({ length: 14 }).map((_, i: any) => {
            const moo = i + 1;
            const mooData = vulnerableData.filter((v: any) => {
              const regInfo = registryData?.find((r: any) => String(r.national_id).trim() === String(v.national_id).trim());
              if (regInfo && regInfo.village_no) {
                return String(regInfo.village_no).trim() === String(moo);
              }
              return false;
            });

            return {
              id: moo, name: `${moo}`, count: mooData.length,
              ELDERLY: mooData.filter((p: any) => p.vulnerabilities?.includes('ELDERLY')).length,
              DISABLED: mooData.filter((p: any) => p.vulnerabilities?.includes('DISABLED')).length,
              BEDRIDDEN: mooData.filter((p: any) => p.vulnerabilities?.includes('BEDRIDDEN')).length,
              LOW_INCOME: mooData.filter((p: any) => p.vulnerabilities?.includes('LOW_INCOME')).length,
              PREGNANT: mooData.filter((p: any) => p.vulnerabilities?.includes('PREGNANT')).length,
            };
          });
          
          setVillageData(villages.filter((v: any) => v.count > 0));

          // 👇 คำนวณอายุแบบดึงตัวเลข 4 หลัก (แก้ปัญหา พ.ศ. และ Format เพี้ยน 100%) 👇
          const currentYear = new Date().getFullYear();
          const ageGroups = [
            { name: 'เด็ก (0-14)', min: 0, max: 14 },
            { name: 'วัยรุ่น (15-24)', min: 15, max: 24 },
            { name: 'วัยแรงงาน (25-59)', min: 25, max: 59 },
            { name: 'ผู้สูงอายุ (60-69)', min: 60, max: 69 },
            { name: 'สูงอายุมาก (70+)', min: 70, max: 150 }
          ];
          
          const aData = ageGroups.map(group => {
            const count = vulnerableData.filter((p: any) => {
              let age = 0;
              if (p.birth_date) {
                const dateStr = String(p.birth_date);
                // 👇 ค้นหาตัวเลข 4 หลักที่ติดกัน (ไม่ว่าจะเป็น 2518-05-25 หรือ 25/05/2518) 👇
                const match = dateStr.match(/\d{4}/);
                if (match) {
                  let birthYear = parseInt(match[0]);
                  // ถ้าปีเกิน 2400 แสดงว่าเป็น พ.ศ. ให้ลบ 543
                  if (birthYear > 2400) birthYear -= 543;
                  age = currentYear - birthYear;
                }
              }
              return age >= group.min && age <= group.max;
            }).length;
            return { name: group.name, value: count };
          });
          
          setAgeData(aData.filter((group: any) => group.value > 0));

          // คำนวณสถานะ
          setStatusData([
            { name: 'ช่วยเหลือแล้ว', value: Number(total - pending) || 0, color: '#EC4899' },
            { name: 'รอดำเนินการ', value: Number(pending) || 0, color: '#0EA5E9' },
          ]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <LoadingScreen />; {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <header className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8 md:w-10 md:h-10 object-contain" />
            <div>
              <h1 className="font-bold text-slate-900 text-sm md:text-base leading-tight">ข้อมูลกลุ่มเปราะบาง</h1>
              <p className="text-[10px] md:text-xs text-pink-600 font-medium">เทศบาลตำบลท่าวังทอง</p>
            </div>
          </div>
          <button onClick={() => router.push('/login')} className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-sky-500 text-white p-2 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm shadow-md">
            <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">เข้าสู่ระบบ</span>
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-3 md:px-4 mt-4 md:mt-6 space-y-3 md:space-y-4">
        
        <motion.div 
          initial="hidden" animate="visible" 
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3"
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-gradient-to-r from-pink-500 to-sky-500 rounded-xl md:rounded-2xl p-3 text-white shadow-md flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Users className="w-4 h-4 md:w-5 md:h-5" /></div>
            <div><p className="text-white/80 text-[10px] md:text-xs mb-0.5">ทั้งหมด</p><h3 className="text-lg md:text-2xl font-bold">{stats.total} <span className="text-[10px] font-normal">ราย</span></h3></div>
          </motion.div>
          
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-white rounded-xl md:rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-sm md:text-lg">👵</div>
            <div><p className="text-slate-500 text-[10px] md:text-xs mb-0.5">ผู้สูงอายุ</p><h3 className="text-base md:text-xl font-bold text-slate-800">{stats.elderly} <span className="text-[10px] font-normal text-slate-400">ราย</span></h3></div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-white rounded-xl md:rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 text-sm md:text-lg">♿</div>
            <div><p className="text-slate-500 text-[10px] md:text-xs mb-0.5">ผู้พิการ</p><h3 className="text-base md:text-xl font-bold text-slate-800">{stats.disabled} <span className="text-[10px] font-normal text-slate-400">ราย</span></h3></div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-white rounded-xl md:rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 text-sm md:text-lg">🛏️</div>
            <div><p className="text-slate-500 text-[10px] md:text-xs mb-0.5">ติดเตียง</p><h3 className="text-base md:text-xl font-bold text-slate-800">{stats.bedridden} <span className="text-[10px] font-normal text-slate-400">ราย</span></h3></div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-white rounded-xl md:rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-yellow-50 flex items-center justify-center shrink-0 text-sm md:text-lg">💰</div>
            <div><p className="text-slate-500 text-[10px] md:text-xs mb-0.5">รายได้น้อย</p><h3 className="text-base md:text-xl font-bold text-slate-800">{stats.lowIncome} <span className="text-[10px] font-normal text-slate-400">ราย</span></h3></div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-white rounded-xl md:rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-sm md:text-lg">🤰</div>
            <div><p className="text-slate-500 text-[10px] md:text-xs mb-0.5">ตั้งครรภ์</p><h3 className="text-base md:text-xl font-bold text-slate-800">{stats.pregnant} <span className="text-[10px] font-normal text-slate-400">ราย</span></h3></div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
          <div className="bg-[#1e293b] rounded-xl md:rounded-2xl p-3 md:p-4 text-white shadow-md flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0"><ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-pink-400" /></div>
            <div><p className="text-slate-300 text-[10px] md:text-xs mb-0.5">รอรับความช่วยเหลือ</p><h3 className="text-base md:text-xl font-bold">{stats.pending} <span className="text-[10px] font-normal">ราย</span></h3></div>
          </div>
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-slate-100 flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-pink-50 flex items-center justify-center shrink-0"><HeartPulse className="w-4 h-4 md:w-5 md:h-5 text-pink-500" /></div>
            <div><p className="text-slate-500 text-[10px] md:text-xs mb-0.5">เปราะบางทับซ้อน (2+ ด้าน)</p><h3 className="text-base md:text-xl font-bold text-slate-800">{stats.overlap} <span className="text-[10px] font-normal text-slate-400">ราย</span></h3></div>
          </div>
          <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-slate-100 flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-sky-50 flex items-center justify-center shrink-0"><UserX className="w-4 h-4 md:w-5 md:h-5 text-sky-500" /></div>
            <div><p className="text-slate-500 text-[10px] md:text-xs mb-0.5">ใช้ชีวิตลำพัง (เสี่ยงสูง)</p><h3 className="text-base md:text-xl font-bold text-slate-800">{stats.livesAlone} <span className="text-[10px] font-normal text-slate-400">ราย</span></h3></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white p-2 md:p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[300px] md:h-[400px]">
            <h2 className="font-bold text-sm md:text-base text-slate-800 flex items-center gap-2 px-1 mb-2"><span className="text-pink-500">📍</span> แผนที่ความหนาแน่น</h2>
            <div className="relative w-full flex-1 rounded-xl overflow-hidden border border-slate-100">
              <PublicMap villages={villageData} />
            </div>
          </div>
          <div className="h-[300px] md:h-[400px]"><HouseholdBarChart data={villageData} /></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <div className="h-[300px] md:h-[350px]"><AgeBarChart data={ageData} /></div>
          <div className="h-[300px] md:h-[350px]"><StatusPieChart data={statusData} /></div>
        </div>
        
      </div>
    </main>
  );
}