'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import { checkAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Loader2, Save } from 'lucide-react';
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

export default function NewPersonPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [nationalId, setNationalId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [registryData, setRegistryData] = useState<any>(null);
  
  const [coords, setCoords] = useState({ lat: 19.1750, lng: 99.9150 });
  // 👇 ประกาศ State สำหรับล็อคพิกัด 👇
  const [isLocationLocked, setIsLocationLocked] = useState(false); 
  
  const [selectedVuln, setSelectedVuln] = useState<VulnType | null>(null);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
  }, []);

  const handleSearch = async () => {
    if (nationalId.length !== 13) return toast.error('กรุณากรอกเลขบัตร 13 หลัก');
    setIsSearching(true);
    try {
      // 1. ค้นหาข้อมูลทะเบียนราษฎร
      const { data, error } = await supabase().from('registry_persons').select('*').eq('national_id', nationalId).single();
      
      if (error || !data) {
        toast.error('บุคคลนี้ไม่ได้อยุ่ในพื้นที่ตำบลท่าวังทอง');
        setRegistryData(null);
        return;
      }

      // 2. ตรวจสอบหมู่บ้าน
      const osmAreaStr = String(user.area || '').replace(/\D/g, '');
      const personVillage = String(data.village_no || '').trim();

      if (osmAreaStr && personVillage && osmAreaStr !== personVillage) {
        toast.error(`บุคคลนี้ไม่ได้อยู่ในพื้นที่ ${user.area} (บุคคลนี้อยู่หมู่ ${personVillage})`, { duration: 5000 });
        setRegistryData(null);
        return;
      }

      // 3. ถ้าผ่าน ให้ตั้งค่าข้อมูล
      setRegistryData(data);
      
      const addressParts = [
        data.house_no ? `${data.house_no}` : '',
        data.soi ? `ซอย${data.soi}` : '',
        data.road ? `ถนน${data.road}` : '',
        data.village_no ? `หมู่ที่ ${data.village_no}` : '',
        data.subdistrict ? `ต.${data.subdistrict}` : '',
        data.district ? `อ.${data.district}` : '',
        data.province ? `จ.${data.province}` : ''
      ].filter(Boolean);
      
      setNote(addressParts.join(' '));

      // 4. ค้นหาประวัติเดิมว่าเคยลงทะเบียนหรือยัง (เพื่อดึงพิกัด)
      const { data: existingVuln } = await supabase()
        .from('vulnerable_persons')
        .select('latitude, longitude')
        .eq('national_id', nationalId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingVuln && existingVuln.length > 0 && existingVuln[0].latitude && existingVuln[0].longitude) {
        setCoords({ lat: existingVuln[0].latitude, lng: existingVuln[0].longitude });
        setIsLocationLocked(true); // 👈 ล็อคพิกัด
        toast.success('พบประวัติเดิม: ล็อคพิกัดตามที่เคยบันทึกไว้แล้ว');
      } else {
        setIsLocationLocked(false); // 👈 ปลดล็อคพิกัด
        toast.success('พบข้อมูลทะเบียนราษฎร');
      }
      
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!registryData) return toast.error('กรุณาค้นหาทะเบียนราษฎรก่อน');
    if (!selectedVuln) return toast.error('กรุณาเลือกประเภทกลุ่มเปราะบาง'); 
    
    setIsSaving(true);
    try {
      // เช็กว่าคนนี้เคยถูกบันทึกประเภทนี้ไปหรือยัง
      const { data: existingRecords } = await supabase()
        .from('vulnerable_persons')
        .select('id, vulnerabilities')
        .eq('national_id', nationalId);

      if (existingRecords && existingRecords.length > 0) {
        const isDuplicate = existingRecords.some((record: any) => 
          record.vulnerabilities && record.vulnerabilities.includes(selectedVuln)
        );

        if (isDuplicate) {
          toast.error(`บุคคลนี้ถูกบันทึกเป็น "${VULN[selectedVuln].label}" ในระบบแล้ว`);
          setIsSaving(false);
          return;
        }
      }

      const { error } = await supabase().from('vulnerable_persons').insert([{
        national_id: nationalId,
        prefix: registryData.prefix || null,
        first_name: registryData.first_name,
        last_name: registryData.last_name,
        birth_date: registryData.birth_date || null,
        latitude: coords.lat,
        longitude: coords.lng,
        note: note,
        vulnerabilities: [selectedVuln], 
        created_by: user.username,
        
        disability_type: selectedVuln === 'DISABLED' ? disabilityData.disabilityType : null,
        disability_profile: selectedVuln === 'DISABLED' ? disabilityData : null,
        elderly_profile: selectedVuln === 'ELDERLY' ? elderlyData : null,
        welfare_profile: (selectedVuln === 'LOW_INCOME' || selectedVuln === 'BEDRIDDEN' || selectedVuln === 'PREGNANT') ? welfareData : null,
      }]);

      if (error) throw error;
      toast.success('บันทึกข้อมูลสำเร็จ!');
      
      // เคลียร์ค่าหลังบันทึก
      setNationalId('');
      setRegistryData(null);
      setSelectedVuln(null);
      setCoords({ lat: 19.1750, lng: 99.9150 });
      setIsLocationLocked(false); // 👈 ปลดล็อค
      setNote('');
      
    } catch (error: any) {
      console.error("Supabase Error:", error);
      toast.error(`ข้อผิดพลาด: ${error.message || 'ไม่สามารถบันทึกได้'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 mt-6">
        
        {/* 1. ค้นหา */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-4">
          <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs">1</span>
            ข้อมูลทะเบียนราษฎร
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="text" maxLength={13} value={nationalId} onChange={e => setNationalId(e.target.value.replace(/\D/g, ''))} placeholder="เลขบัตรประชาชน 13 หลัก" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-pink-400" />
            <button onClick={handleSearch} disabled={isSearching || nationalId.length !== 13} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-900 disabled:opacity-50">
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} ค้นหา
            </button>
          </div>
          {registryData && (
            <div className="mt-4 bg-sky-50 rounded-xl p-4 border border-sky-100 text-sm animate-slide-up">
              <p><span className="text-slate-500">ชื่อ:</span> <span className="font-bold text-slate-800">{registryData.first_name} {registryData.last_name}</span></p>
              <p><span className="text-slate-500">ที่อยู่:</span> {note}</p>
            </div>
          )}
        </div>

        {/* 2. พิกัด */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-4">
          <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs">2</span>
            พิกัดที่อยู่
          </h2>
          <LocationPicker 
            key={isLocationLocked ? 'locked' : 'unlocked'} 
            position={coords} 
            setPosition={setCoords} 
            isLocked={isLocationLocked} 
          />
        </div>

        {/* 3. ประเภท และ ฟอร์มประเมิน */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-4">
          <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs">3</span>
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

        <button onClick={handleSave} disabled={isSaving} className="w-full h-14 rounded-2xl bg-gradient-to-r from-pink-500 to-sky-500 text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50">
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} บันทึกข้อมูล
        </button>
      </div>
    </main>
  );
}