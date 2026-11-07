'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogIn, Users, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { motion, Variants } from 'framer-motion'; // 👈 เพิ่ม Variants

import HouseholdBarChart from '@/components/dashboard/HouseholdBarChart';
import AgeBarChart from '@/components/dashboard/AgeBarChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import LoadingScreen from '@/components/ui/LoadingScreen';

const PublicMap = dynamic(() => import('@/components/map/PublicMap'), { 
  ssr: false,
  loading: () => <LoadingScreen />
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
          const uniquePersonsMap = new Map();
          vulnerableData.forEach((p: any) => {
            const key = p.national_id || p.id;
            if (!uniquePersonsMap.has(key)) {
              uniquePersonsMap.set(key, { ...p, vulnerabilities: new Set(p.vulnerabilities || []), record_ids: [p.id] });
            } else {
              const existing = uniquePersonsMap.get(key);
              (p.vulnerabilities || []).forEach((v: string) => existing.vulnerabilities.add(v));
              existing.record_ids.push(p.id);
            }
          });

          const uniquePersons = Array.from(uniquePersonsMap.values()).map((p: any) => ({ ...p, vulnerabilities: Array.from(p.vulnerabilities) }));

          const total = uniquePersons.length;
          const elderly = uniquePersons.filter((p: any) => p.vulnerabilities.includes('ELDERLY')).length;
          const disabled = uniquePersons.filter((p: any) => p.vulnerabilities.includes('DISABLED')).length;
          const bedridden = uniquePersons.filter((p: any) => p.vulnerabilities.includes('BEDRIDDEN')).length;
          const lowIncome = uniquePersons.filter((p: any) => p.vulnerabilities.includes('LOW_INCOME')).length;
          const pregnant = uniquePersons.filter((p: any) => p.vulnerabilities.includes('PREGNANT')).length;
          
          const overlap = uniquePersons.filter((p: any) => p.vulnerabilities.length > 1).length;
          const livesAlone = uniquePersons.filter((p: any) => p.lives_alone === true || p.note?.includes('อยู่คนเดียว')).length;

          const assistedNationalIds = new Set();
          interventions?.forEach((inv: any) => {
            const person = vulnerableData.find((p: any) => p.id === inv.person_id);
            if (person && person.national_id) assistedNationalIds.add(person.national_id);
          });
          const pending = uniquePersons.filter((p: any) => !assistedNationalIds.has(p.national_id)).length;

          setStats({ total, elderly, disabled, bedridden, lowIncome, pregnant, pending, overlap, livesAlone });

          const villages = Array.from({ length: 14 }).map((_, i: any) => {
            const moo = i + 1;
            const mooData = uniquePersons.filter((v: any) => {
              const cleanVulnId = String(v.national_id).replace(/\D/g, '');
              const regInfo = registryData?.find((r: any) => String(r.national_id).replace(/\D/g, '') === cleanVulnId);
              return regInfo && String(regInfo.village_no).trim() === String(moo);
            });

            const uniqueHouseholds = new Set();
            mooData.forEach((v: any) => {
              const cleanVulnId = String(v.national_id).replace(/\D/g, '');
              const regInfo = registryData?.find((r: any) => String(r.national_id).replace(/\D/g, '') === cleanVulnId);
              let houseKey = regInfo?.house_code ? String(regInfo.house_code).trim() : regInfo?.house_no ? String(regInfo.house_no).trim() : v.national_id;
              if (houseKey) uniqueHouseholds.add(houseKey);
            });

            return {
              id: moo, name: `${moo}`, households: uniqueHouseholds.size, members: mooData.length,
              ELDERLY: mooData.filter((p: any) => p.vulnerabilities.includes('ELDERLY')).length,
              DISABLED: mooData.filter((p: any) => p.vulnerabilities.includes('DISABLED')).length,
              BEDRIDDEN: mooData.filter((p: any) => p.vulnerabilities.includes('BEDRIDDEN')).length,
              LOW_INCOME: mooData.filter((p: any) => p.vulnerabilities.includes('LOW_INCOME')).length,
              PREGNANT: mooData.filter((p: any) => p.vulnerabilities.includes('PREGNANT')).length,
            };
          });
          setVillageData(villages.filter((v: any) => v.households > 0 || v.members > 0));

          const currentYear = new Date().getFullYear();
          const ageGroups = [
            { name: 'เด็ก (0-14)', min: 0, max: 14 }, { name: 'วัยรุ่น (15-24)', min: 15, max: 24 },
            { name: 'วัยแรงงาน (25-59)', min: 25, max: 59 }, { name: 'ผู้สูงอายุ (60-69)', min: 60, max: 69 },
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

          setStatusData([
            { name: 'ช่วยเหลือแล้ว', value: Number(total - pending) || 0, color: '#EC4899' },
            { name: 'รอดำเนินการ', value: Number(pending) || 0, color: '#0EA5E9' },
          ]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <LoadingScreen />;

  // 👇 กำหนด Type Variants ชัดเจน เพื่อไม่ให้ Framer Motion ฟ้อง Error 👇
  const fadeUpVariant: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        ease: "easeOut" // ตอนนี้ TypeScript จะรู้แล้วว่านี่คือ Easing ที่ถูกต้อง
      } 
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-100/50 via-slate-50 to-sky-100/50 pb-10">
      
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={48} 
              height={48} 
              sizes="(max-width: 768px) 40px, 48px"
              className="object-contain w-10 h-10 md:w-12 md:h-12 drop-shadow-sm" 
            />
            <div>
              <h1 className="font-extrabold text-slate-800 text-sm md:text-xl tracking-tight leading-tight">ระบบข้อมูลกลุ่มเปราะบาง</h1>
              <p className="text-[10px] md:text-sm text-pink-600 font-semibold tracking-wide">เทศบาลตำบลท่าวังทอง</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/login')} 
            className="flex items-center gap-1.5 md:gap-2 bg-slate-800 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-full font-semibold shadow-lg hover:bg-slate-900 hover:scale-105 transition-all text-xs md:text-sm whitespace-nowrap shrink-0"
          >
            <LogIn className="w-3.5 h-3.5 md:w-4 md:h-4" /> เข้าสู่ระบบ
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 mt-4 md:mt-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-stretch">
          
          <motion.div 
            variants={fadeUpVariant} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.1 }}
            className="md:col-span-8 bg-white/90 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col justify-between h-full"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-slate-500 text-sm md:text-base font-medium mb-1">ผู้ลงทะเบียนเปราะบางทั้งหมด</p>
                <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-sky-500 leading-none">
                  {stats.total} <span className="text-xl md:text-2xl font-bold text-slate-400">ราย</span>
                </h2>
              </div>
              <p className="text-xs md:text-sm text-slate-400 flex items-center gap-1"><Users className="w-4 h-4" /> จากฐานข้อมูลทั้งหมด</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 w-full">
              <div className="bg-orange-50 rounded-xl p-3 flex flex-col items-center justify-center border border-orange-100/50 hover:bg-orange-100/50 transition-colors">
                <span className="text-2xl mb-1">👵</span>
                <span className="text-xl font-bold text-orange-600">{stats.elderly}</span>
                <span className="text-[10px] font-medium text-orange-500 text-center">ผู้สูงอายุ</span>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 flex flex-col items-center justify-center border border-purple-100/50 hover:bg-purple-100/50 transition-colors">
                <span className="text-2xl mb-1">♿</span>
                <span className="text-xl font-bold text-purple-600">{stats.disabled}</span>
                <span className="text-[10px] font-medium text-purple-500 text-center">ผู้พิการ</span>
              </div>
              <div className="bg-red-50 rounded-xl p-3 flex flex-col items-center justify-center border border-red-100/50 hover:bg-red-100/50 transition-colors">
                <span className="text-2xl mb-1">🛏️</span>
                <span className="text-xl font-bold text-red-600">{stats.bedridden}</span>
                <span className="text-[10px] font-medium text-red-500 text-center">ติดเตียง</span>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3 flex flex-col items-center justify-center border border-yellow-100/50 hover:bg-yellow-100/50 transition-colors">
                <span className="text-2xl mb-1">💰</span>
                <span className="text-xl font-bold text-yellow-600">{stats.lowIncome}</span>
                <span className="text-[10px] font-medium text-yellow-500 text-center">รายได้น้อย</span>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 flex flex-col items-center justify-center border border-blue-100/50 hover:bg-blue-100/50 transition-colors">
                <span className="text-2xl mb-1">🤰</span>
                <span className="text-xl font-bold text-blue-600">{stats.pregnant}</span>
                <span className="text-[10px] font-medium text-blue-500 text-center">ตั้งครรภ์</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={fadeUpVariant} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-4 bg-gradient-to-br from-[#1e293b] to-slate-800 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 shadow-lg text-white relative overflow-hidden flex flex-col justify-between h-full"
          >
            <div className="absolute -right-4 -top-4 opacity-5"><ShieldAlert className="w-48 h-48" /></div>
            
            <div>
              <p className="text-slate-300 text-sm md:text-base font-medium mb-1">เปราะบางทับซ้อน (2+ ด้าน)</p>
              <h2 className="text-5xl md:text-6xl font-black mb-6">{stats.overlap} <span className="text-lg font-normal text-slate-400">ราย</span></h2>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-2">
                <span>สัดส่วนความซับซ้อน</span>
                <span className="font-bold text-pink-400">{((stats.overlap / (stats.total || 1)) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5 mb-4">
                <div className="bg-gradient-to-r from-pink-500 to-pink-400 h-2.5 rounded-full" style={{ width: `${(stats.overlap / (stats.total || 1)) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-xs text-slate-300">รอรับการช่วยเหลือ</span>
                <span className="font-bold text-white text-lg">{stats.pending} ราย</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={fadeUpVariant} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.1 }} 
            className="md:col-span-7 bg-white/90 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-white flex flex-col h-[450px] md:h-[500px] overflow-hidden"
          >
            <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-center gap-2 p-5 pb-2">
              <span className="w-2 h-6 bg-pink-500 rounded-full inline-block"></span> แผนที่ความหนาแน่น
            </h3>
            <div className="relative flex-1 w-full h-full">
              <PublicMap villages={villageData} />
            </div>
          </motion.div>

          <motion.div 
            variants={fadeUpVariant} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.1 }} 
            transition={{ delay: 0.2 }}
            className="md:col-span-5 bg-white/90 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] p-2 shadow-sm border border-white h-[450px] md:h-[500px]"
          >
            <HouseholdBarChart data={villageData} />
          </motion.div>

          <motion.div 
            variants={fadeUpVariant} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.1 }} 
            className="md:col-span-6 bg-white/90 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] p-2 shadow-sm border border-white h-[400px]"
          >
            <AgeBarChart data={ageData} />
          </motion.div>

          <motion.div 
            variants={fadeUpVariant} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.1 }} 
            transition={{ delay: 0.2 }}
            className="md:col-span-6 bg-white/90 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] p-2 shadow-sm border border-white h-[400px]"
          >
            <StatusPieChart data={statusData} />
          </motion.div>

        </div>
      </div>
    </main>
  );
}