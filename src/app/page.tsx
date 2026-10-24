'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogIn, MapPin, AlertCircle, ShieldCheck, UserCheck, Users } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { VULN, type VulnType } from '@/lib/constants';
import { supabase } from '@/lib/supabase/client';

const PublicMap = dynamic(() => import('@/components/map/PublicMap'), { ssr: false });
const HouseholdBarChart = dynamic(() => import('@/components/dashboard/HouseholdBarChart'), { ssr: false });
const AgeBarChart = dynamic(() => import('@/components/dashboard/AgeBarChart'), { ssr: false });
const StatusPieChart = dynamic(() => import('@/components/dashboard/StatusPieChart'), { ssr: false });

export default function PublicHomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  const [stats, setStats] = useState({ total: 0, typeCounts: {} as Record<VulnType, number> });
  const [insights, setInsights] = useState({ overlap: 0, pending: 0, livesAlone: 0 });
  
  const [barData, setBarData] = useState<any[]>([]);
  const [mapVillages, setMapVillages] = useState<any[]>([]); 
  const [ageData, setAgeData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    const fetchData = async () => {
      try {
        const { data: vulnerableData } = await supabase().from('vulnerable_persons').select('*');
        const { data: registryData } = await supabase().from('registry_persons').select('national_id, village_no');
        const { data: interventions } = await supabase().from('interventions').select('*');
        
        if (vulnerableData && vulnerableData.length > 0) {
          const typeCounts = {} as Record<VulnType, number>;
          (Object.keys(VULN) as VulnType[]).forEach(key => {
            typeCounts[key] = vulnerableData.filter((p: any) => p.vulnerabilities?.includes(key)).length;
          });
          setStats({ total: vulnerableData.length, typeCounts });

          const overlapCount = vulnerableData.filter((p: any) => p.vulnerabilities?.length > 1).length;
          const assistedIds = new Set(interventions?.map((i: any) => i.person_id) || []);
          const assistedCount = vulnerableData.filter((p: any) => assistedIds.has(p.id)).length;
          const pendingCount = vulnerableData.length - assistedCount;
          const livesAloneCount = vulnerableData.filter((p: any) => p.lives_alone === true || p.note?.includes('อยู่คนเดียว')).length;
          
          setInsights({ overlap: overlapCount, pending: pendingCount, livesAlone: livesAloneCount });

          setStatusData([
            { name: 'ช่วยเหลือแล้ว', value: assistedCount, color: '#EC4899' },
            { name: 'รอดำเนินการ', value: pendingCount, color: '#0EA5E9' },
          ].filter(item => item.value > 0));

          // 👇 แก้ไข Type ที่นี่แล้ว (เติม : any และ : number) 👇
          const villagesData = Array.from({ length: 14 }).map((_: any, i: number) => {
            const moo = i + 1;
            const mooData = vulnerableData.filter((v: any) => {
              const regInfo = registryData?.find((r: any) => r.national_id === v.national_id);
              return regInfo && parseInt(regInfo.village_no) === moo;
            });
            const total = mooData.length;
            return {
              id: moo, name: `หมู่ ${moo}`, count: total, 
              color: total >= 5 ? '#BE185D' : total >= 3 ? '#EC4899' : total >= 1 ? '#F9A8D4' : '#FDF2F8',
              ELDERLY: mooData.filter((p: any) => p.vulnerabilities?.includes('ELDERLY')).length,
              DISABLED: mooData.filter((p: any) => p.vulnerabilities?.includes('DISABLED')).length,
              BEDRIDDEN: mooData.filter((p: any) => p.vulnerabilities?.includes('BEDRIDDEN')).length,
              LOW_INCOME: mooData.filter((p: any) => p.vulnerabilities?.includes('LOW_INCOME')).length,
              PREGNANT: mooData.filter((p: any) => p.vulnerabilities?.includes('PREGNANT')).length,
            };
          });
          setMapVillages(villagesData); 
          setBarData(villagesData.filter(v => v.count > 0));

          const currentYear = new Date().getFullYear();
          const getAge = (birth: string) => birth ? currentYear - new Date(birth).getFullYear() : 0;
          const ageGroups = [
            { name: 'เด็ก (0-14)', min: 0, max: 14 }, { name: 'วัยรุ่น (15-24)', min: 15, max: 24 },
            { name: 'วัยแรงงาน (25-59)', min: 25, max: 59 }, { name: 'ผู้สูงอายุ (60-69)', min: 60, max: 69 },
            { name: 'สูงอายุมาก (70+)', min: 70, max: 150 }
          ];
          const ageStats = ageGroups.map(group => ({
            name: group.name, value: vulnerableData.filter((p: any) => {
              const age = getAge(p.birth_date); return age >= group.min && age <= group.max;
            }).length
          }));
          setAgeData(ageStats.filter(g => g.value > 0));

        } else {
          setMapVillages(Array.from({ length: 14 }).map((_, i) => ({ id: i+1, name: `หมู่ ${i+1}`, count: 0, color: '#FDF2F8' })));
          setStatusData([{ name: 'ยังไม่มีข้อมูล', value: 1, color: '#e2e8f0' }]);
        }
      } catch (err) { 
        console.error(err); 
      }
    };
    fetchData();
  }, []);

  if (!mounted) return <div className="min-h-screen bg-slate-50" />;

  return (
    <main className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      <header className="bg-white shadow-sm z-20 sticky top-0">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full p-1 border border-slate-100">
              <Image src="/logo.png" alt="Logo" width={48} height={48} className="object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm md:text-lg leading-tight">ระบบข้อมูลกลุ่มเปราะบาง</h1>
              <p className="text-[10px] md:text-xs text-pink-600 font-medium">เทศบาลตำบลท่าวังทอง</p>
            </div>
          </div>
          <button onClick={() => router.push('/login')} className="flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-pink-500 to-sky-500 text-white px-3 md:px-6 py-2 md:py-2.5 rounded-full font-semibold shadow-md hover:scale-105 transition-all text-xs md:text-sm">
            <LogIn className="w-3 h-3 md:w-4 md:h-4" /> 
            <span className="hidden sm:inline">เข้าสู่ระบบเจ้าหน้าที่</span>
            <span className="sm:hidden">เข้าสู่ระบบ</span>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 flex-1 flex flex-col gap-4 md:gap-6">
        
        {/* การ์ดสถิติ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <div className="col-span-2 md:col-span-3 lg:col-span-1 bg-gradient-to-r from-pink-500 to-sky-500 rounded-2xl p-4 text-white shadow-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-white/90 text-[11px] md:text-xs font-medium mb-0.5 truncate">ผู้ลงเปราะบางทั้งหมด</p>
              <h3 className="text-xl md:text-3xl font-bold leading-none">{stats.total} <span className="text-xs md:text-sm font-normal">ราย</span></h3>
            </div>
          </div>

          {(Object.keys(VULN) as VulnType[]).map((key) => (
            <div key={key} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-xl">
                {VULN[key].emoji}
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <p className="text-slate-500 text-[10px] md:text-xs font-medium mb-0.5 truncate">{VULN[key].label}</p>
                <h4 className="text-lg md:text-2xl font-bold text-slate-800 leading-none">
                  {stats.typeCounts[key] || 0} <span className="text-[10px] md:text-xs font-normal text-slate-400">ราย</span>
                </h4>
              </div>
            </div>
          ))}
        </motion.div>

        {/* การ์ด Insights (แบ่งซ้าย-ขวา) */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="col-span-2 md:col-span-1 bg-slate-800 rounded-2xl p-4 text-white shadow-md flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-pink-400" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-slate-300 text-[11px] md:text-xs mb-0.5 truncate">ผู้รอรับความช่วยเหลือ</p>
              <h3 className="text-xl md:text-2xl font-bold leading-none">{insights.pending} <span className="text-sm font-normal">ราย</span></h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-4">
            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-pink-500" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-slate-500 text-[10px] md:text-xs mb-0.5 leading-tight truncate">ความเปราะบางทับซ้อน (2+ ด้าน)</p>
              <h3 className="text-lg md:text-2xl font-bold text-slate-800 leading-none">{insights.overlap} <span className="text-[10px] md:text-sm font-normal text-slate-400">ราย</span></h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-4">
            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-sky-500" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-slate-500 text-[10px] md:text-xs mb-0.5 leading-tight truncate">ผู้ใช้ชีวิตลำพัง (กลุ่มเสี่ยงสูง)</p>
              <h3 className="text-lg md:text-2xl font-bold text-slate-800 leading-none">{insights.livesAlone} <span className="text-[10px] md:text-sm font-normal text-slate-400">ราย</span></h3>
            </div>
          </div>
        </motion.div>

        {/* กริดกราฟ 2x2 */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full">
          
          <div className="bg-white p-3 md:p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden h-[300px] md:h-[400px]">
            <div className="flex justify-between items-center mb-2 md:mb-4 px-2 z-10 relative">
              <h2 className="font-bold text-slate-800 text-sm md:text-lg flex items-center gap-2">
                <MapPin className="text-pink-500 w-4 h-4 md:w-5 md:h-5" /> แผนที่ความหนาแน่น
              </h2>
            </div>
            <div className="relative w-full flex-1 rounded-2xl overflow-hidden border border-slate-100">
              <PublicMap villages={mapVillages} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 h-[350px] md:h-[400px] flex flex-col">
            <div className="flex-1 w-full h-full relative">
              <HouseholdBarChart barData={barData} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 h-[300px] md:h-[350px] flex flex-col">
            <div className="flex-1 w-full h-full relative">
              <AgeBarChart ageData={ageData} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 h-[300px] md:h-[350px] flex flex-col">
            <div className="flex-1 w-full h-full relative">
              <StatusPieChart statusData={statusData} />
            </div>
          </div>
          
        </motion.div>
      </div>
    </main>
  );
}