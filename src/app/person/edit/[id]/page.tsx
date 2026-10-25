'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import { checkAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, MapPin } from 'lucide-react';
import { VULN, type VulnType } from '@/lib/constants';
import DisabilityForm from '@/components/form/DisabilityForm';
import ElderlyForm from '@/components/form/ElderlyForm';
import WelfareForm from '@/components/form/WelfareForm';

import { DisabilityFormData } from '@/types/disability';
import { ElderlyFormData } from '@/types/elderly';
import { WelfareFormData } from '@/types/welfare';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-2xl" />
});

export default function EditPersonPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // ข้อมูลส่วนตัว (ดึงมาโชว์ ไม่ให้แก้)
  const [personData, setPersonData] = useState<any>(null);
  const [coords, setCoords] = useState({ lat: 19.1750, lng: 99.9150 });
  const [note, setNote] = useState('');
  
  // เลือกได้ทีละอย่าง
  const [selectedVuln, setSelectedVuln] = useState<VulnType | null>(null);

  // State สำหรับฟอร์มยิบย่อย
  const [disabilityData, setDisabilityData] = useState<DisabilityFormData>({
    nickname: '', maritalStatus: '', education: '', houseStatus: '', houseCondition: '', houseFacilities: [],
    congenitalDiseases: [], medicalRights: [], medicalEquipment: '', healthNeeds: '',
    isRegistered: false, disabilityType: '', disabilityCause: '', disabilityLevel: '', canCommunicate: false,
    hasCaregiver: false, caregiverName: '', caregiverRelation: '', caregiverPhone: '',
    occupations: [], incomeLevel: '', familyIncome: '', hasDebt: false, receivedWelfare: [], socialActivities: [], needsVocationalTraining: false,
    adlScores: {},
  });

  const [elderlyData, setElderlyData] = useState<ElderlyFormData>({
    maritalStatus: '', occupation: '', communityActivity: '',
    weight: '', height: '', vision: '', hearing: '', selfRatedHealth: '',
    diseases: [], physicalProblems: [], exerciseHabit: '', smokingHabit: '', drinkingHabit: '',
    adlScores: {}, tgdsScores: {},
    hasFinancialSupport: false, hasCaregiverSupport: false, hasMentalSupport: false,
  });

  const [welfareData, setWelfareData] = useState<WelfareFormData>({
    hardshipTypes: [], hardshipCauses: [], healthStatus: '', healthStatusDetail: '',
    governmentNeeds: [], governmentNeedsDetail: '', communityNeeds: [], communityNeedsDetail: '',
    hasReceivedHelp: false, receivedHelpTypes: [], receivedHelpYear: '', receivedHelpAgency: '',
    incomeSufficiency: '', expenseSufficiency: '', debtStatus: '',
    personalHistory: '', familyHistory: '',
  });

  useEffect(() => {
    const auth = checkAuth(['OSM']);
    if (!auth) { window.location.href = '/login'; return; }
    setUser(auth);

    const fetchRecord = async () => {
      try {
        const { data, error } = await supabase().from('vulnerable_persons').select('*').eq('id', id).single();
        if (error || !data) throw new Error('ไม่พบข้อมูล');
        
        setPersonData(data);
        setCoords({ lat: data.latitude || 19.1750, lng: data.longitude || 99.9150 });
        setNote(data.note || '');
        
        // ตั้งค่าประเภทเปราะบาง (ดึงตัวแรกมาแสดง)
        if (data.vulnerabilities && data.vulnerabilities.length > 0) {
          setSelectedVuln(data.vulnerabilities[0] as VulnType);
        }

        // ดึงข้อมูลฟอร์มยิบย่อยกลับมา
        if (data.disability_profile) setDisabilityData({ ...disabilityData, ...data.disability_profile });
        if (data.elderly_profile) setElderlyData({ ...elderlyData, ...data.elderly_profile });
        if (data.welfare_profile) setWelfareData({ ...welfareData, ...data.welfare_profile });

      } catch (err) {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
        router.push('/person/my-records');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const handleUpdate = async () => {
    if (!selectedVuln) return toast.error('กรุณาเลือกประเภทกลุ่มเปราะบาง');
    
    setIsSaving(true);
    try {
      const { error } = await supabase().from('vulnerable_persons').update({
        latitude: coords.lat,
        longitude: coords.lng,
        note: note,
        vulnerabilities: [selectedVuln], // อัปเดตเป็น 1 ตัวเลือก
        
        // อัปเดตฟอร์มยิบย่อย
        disability_type: selectedVuln === 'DISABLED' ? disabilityData.disabilityType : null,
        disability_profile: selectedVuln === 'DISABLED' ? disabilityData : null,
        elderly_profile: selectedVuln === 'ELDERLY' ? elderlyData : null,
        welfare_profile: (selectedVuln === 'LOW_INCOME' || selectedVuln === 'BEDRIDDEN' || selectedVuln === 'PREGNANT') ? welfareData : null,
      }).eq('id', id);

      if (error) throw error;
      toast.success('อัปเดตข้อมูลสำเร็จ!');
      router.push('/person/my-records');
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingScreen />; return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;
  if (!user || !personData) return null;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 mt-6">
        
        {/* Header แก้ไข */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-4 relative">
          <button onClick={() => router.back()} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">แก้ไขข้อมูล</h1>
          <p className="text-pink-600 font-medium text-sm">เจ้าหน้าที่: {user.name}</p>
        </div>

        {/* ข้อมูลส่วนตัว (Read-only) */}
        <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200 mb-4">
          <h2 className="font-bold text-sm text-slate-500 uppercase tracking-wide mb-2">ข้อมูลจากทะเบียนราษฎร (ไม่สามารถแก้ไขได้)</h2>
          <p className="text-lg font-bold text-slate-800">{personData.prefix}{personData.first_name} {personData.last_name}</p>
          <p className="text-sm text-slate-500">เลขบัตร: {personData.national_id}</p>
        </div>

        {/* 1. พิกัด */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-4">
          <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs">1</span>
            พิกัดที่อยู่
          </h2>
          <LocationPicker position={coords} setPosition={setCoords} />
        </div>

        {/* 2. ประเภท และ ฟอร์มประเมิน */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-4">
          <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs">2</span>
            ประเภทกลุ่มเปราะบางและแบบประเมิน
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {(Object.keys(VULN) as VulnType[]).map(key => (
              <button key={key} onClick={() => setSelectedVuln(key)} className={`p-3 rounded-xl border-2 transition-all text-left flex items-center gap-2 ${selectedVuln === key ? 'border-transparent text-white shadow-md' : 'border-slate-100 bg-slate-50 text-slate-600'}`} style={selectedVuln === key ? { backgroundColor: VULN[key].color } : {}}>
                <span className="text-xl">{VULN[key].emoji}</span>
                <span className="text-sm font-medium">{VULN[key].label}</span>
              </button>
            ))}
          </div>

          {/* แสดงฟอร์มตามที่เลือก */}
          {selectedVuln === 'DISABLED' && (
            <div className="mt-6 border-t border-slate-100 pt-4 animate-slide-up">
              <h3 className="font-bold text-orange-500 mb-2">แบบประเมินผู้พิการ</h3>
              <DisabilityForm data={disabilityData} onChange={setDisabilityData} />
            </div>
          )}
          {selectedVuln === 'ELDERLY' && (
            <div className="mt-6 border-t border-slate-100 pt-4 animate-slide-up">
              <h3 className="font-bold text-purple-500 mb-2">แบบประเมินผู้สูงอายุ</h3>
              <ElderlyForm data={elderlyData} onChange={setElderlyData} />
            </div>
          )}
          {(selectedVuln === 'LOW_INCOME' || selectedVuln === 'BEDRIDDEN' || selectedVuln === 'PREGNANT') && (
            <div className="mt-6 border-t border-slate-100 pt-4 animate-slide-up">
              <h3 className="font-bold text-yellow-500 mb-2">แบบประเมินความยากลำบาก</h3>
              <WelfareForm data={welfareData} onChange={setWelfareData} />
            </div>
          )}
        </div>

        <button onClick={handleUpdate} disabled={isSaving} className="w-full h-14 rounded-2xl bg-sky-500 text-white font-bold text-lg shadow-lg hover:bg-sky-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} บันทึกการแก้ไข
        </button>
      </div>
    </main>
  );
}