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
import LoadingScreen from '@/components/ui/LoadingScreen'; // 👈 เพิ่มบรรทัดนี้เข้ามา

const PublicMap = dynamic(() => import('@/components/map/PublicMap'), { 
  ssr: false,
  loading: () => <LoadingScreen /> // 👈 ใช้ LoadingScreen ตอนโหลดแผนที่ด้วย
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
        const { data: registryData } = await supabase().from('registry_persons').select('national_id, village_no, house_code, house_no');
        const { data: interventions } = await supabase().from('interventions').select('*');

        if (vulnerableData) {
          // 1. รวมข้อมูลซ้ำ (Deduplication)
          const uniquePersonsMap = new Map();
          vulnerableData.forEach((p: any) => {
            const key = p.national_id || p.id;
            if (!uniquePersonsMap.has(key)) {
              uniquePersonsMap.set(key, {
                ...p,
                vulnerabilities: new Set(p.vulnerabilities || []),
                record_ids: [p.id]
              });
            } else {
              const existing = uniquePersonsMap.get(key);
              (p.vulnerabilities || []).forEach((v: string) => existing.vulnerabilities.add(v));
              existing.record_ids.push(p.id);
            }
          });

          const uniquePersons = Array.from(uniquePersonsMap.values()).map((p: any) => ({
            ...p,
            vulnerabilities: Array.from(p.vulnerabilities)
          }));

          // 2. คำนวณสถิติ
          const total = uniquePersons.length;
          const elderly = uniquePersons.filter((p: any) => p.vulnerabilities.includes('ELDERLY')).length;
          const disabled = uniquePersons.filter((p: any) => p.vulnerabilities.includes('DISABLED')).length;
          const bedridden = uniquePersons.filter((p: any) => p.vulnerabilities.includes('BEDRIDDEN')).length;
          const lowIncome = uniquePersons.filter((p: any) => p.vulnerabilities.includes('LOW_INCOME')).length;
          const pregnant = uniquePersons.filter((p: any) => p.vulnerabilities.includes('PREGNANT')).length;
          
          const overlap = uniquePersons.filter((p: any) => p.vulnerabilities.length > 1).length;
          const livesAlone = uniquePersons.filter((p: any) => p.lives_alone === true || p.note?.includes('อยู่คนเดียว')).length;

          // 3. คำนวณรอรับความช่วยเหลือ
          const assistedNationalIds = new Set();
          interventions?.forEach((inv: any) => {
            const person = vulnerableData.find((p: any) => p.id === inv.person_id);
            if (person && person.national_id) {
              assistedNationalIds.add(person.national_id);
            }
          });
          const pending = uniquePersons.filter((p: any) => !assistedNationalIds.has(p.national_id)).length;

          setStats({ total, elderly, disabled, bedridden, lowIncome, pregnant, pending, overlap, livesAlone });

          // 4. คำนวณหมู่บ้าน
          const villages = Array.from({ length: 14 }).map((_, i: any) => {
            const moo = i + 1;
            const mooData = uniquePersons.filter((v: any) => {
              const cleanVulnId = String(v.national_id).replace(/\D/g, '');
              const regInfo = registryData?.find((r: any) => {
                const cleanRegId = String(r.national_id).replace(/\D/g, '');
                return cleanRegId === cleanVulnId && cleanRegId !== '';
              });
              return regInfo && String(regInfo.village_no).trim() === String(moo);
            });

            const uniqueHouseholds = new Set();
            mooData.forEach((v: any) => {
              const cleanVulnId = String(v.national_id).replace(/\D/g, '');
              const regInfo = registryData?.find((r: any) => String(r.national_id).replace(/\D/g, '') === cleanVulnId);
              const houseKey = regInfo?.house_code || regInfo?.house_no || v.note; 
              if (houseKey) uniqueHouseholds.add(houseKey);
            });

            return {
              id: moo, name: `${moo}`, 
              households: uniqueHouseholds.size,
              members: mooData.length,
              ELDERLY: mooData.filter((p: any) => p.vulnerabilities.includes('ELDERLY')).length,
              DISABLED: mooData.filter((p: any) => p.vulnerabilities.includes('DISABLED')).length,
              BEDRIDDEN: mooData.filter((p: any) => p.vulnerabilities.includes('BEDRIDDEN')).length,
              LOW_INCOME: mooData.filter((p: any) => p.vulnerabilities.includes('LOW_INCOME')).length,
              PREGNANT: mooData.filter((p: any) => p.vulnerabilities.includes('PREGNANT')).length,
            };
          });
          
          setVillageData(villages.filter((v: any) => v.households > 0 || v.members > 0));

          // 5. คำนวณช่วงอายุ
          const currentYear = new Date().getFullYear();
          const ageGroups = [
            { name: 'เด็ก (0-14)', min: 0, max: 14 },
            { name: 'วัยรุ่น (15-24)', min: 15, max: 24 },
            { name: 'วัยแรงงาน (25-59)', min: 25, max: 59 },
            { name: 'ผู้สูงอายุ (60-69)', min: 60, max: 69 },
            { name: 'สูงอายุมาก (70+)', min: 70, max: 150 }
          ];
          const aData = ageGroups.map(group => {
            const count = uniquePersons.filter((p: any) => {
              if (!p.birth_date) return false;
              const birthYear = new Date(p.birth_date).getFullYear();
              if (isNaN(birthYear)) return false;
              const age = currentYear - birthYear;
              return age >= group.min && age <= group.max;
            }).length;
            return { name: group.name, value: count };
          });
          setAgeData(aData.filter((group: any) => group.value > 0));

          // 6. คำนวณสถานะ
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

  // 👇 เรียกใช้ LoadingScreen ที่ Import มาแล้ว 👇
  if (isLoading) return <LoadingScreen />;

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

        <div className="grid grid-cols-3 gap-1.5 md:gap-3">
          <div className="bg-[#1e293b] rounded-xl md:rounded-2xl p-2 md:p-4 text-white shadow-md flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-1 md:gap-3 text-center md:text-left">
            <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-300 text-[9px] md:text-xs mb-0.5 leading-tight">รอรับความช่วยเหลือ</p>
              <h3 className="text-base md:text-xl font-bold leading-tight">{stats.pending} <span className="text-[10px] md:text-xs font-normal">ราย</span></h3>
            </div>
          </div>
          
          <div className="bg-white rounded-xl md:rounded-2xl p-2 md:p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-1 md:gap-3 text-center md:text-left">
            <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
              <HeartPulse className="w-4 h-4 md:w-5 md:h-5 text-pink-500" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-500 text-[9px] md:text-xs mb-0.5 leading-tight">เปราะบางทับซ้อน (2+ ด้าน)</p>
              <h3 className="text-base md:text-xl font-bold text-slate-800 leading-tight">{stats.overlap} <span className="text-[10px] md:text-xs font-normal text-slate-400">ราย</span></h3>
            </div>
          </div>

          <div className="bg-white rounded-xl md:rounded-2xl p-2 md:p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-1 md:gap-3 text-center md:text-left">
            <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
              <UserX className="w-4 h-4 md:w-5 md:h-5 text-sky-500" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-500 text-[9px] md:text-xs mb-0.5 leading-tight">ใช้ชีวิตลำพัง (เสี่ยงสูง)</p>
              <h3 className="text-base md:text-xl font-bold text-slate-800 leading-tight">{stats.livesAlone} <span className="text-[10px] md:text-xs font-normal text-slate-400">ราย</span></h3>
            </div>
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