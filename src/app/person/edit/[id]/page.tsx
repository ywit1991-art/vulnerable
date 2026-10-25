'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ArrowLeft, Check, ImagePlus, X, ShieldCheck, Loader2, Save, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { VULN, type VulnType } from '@/lib/constants';
import { supabase } from '@/lib/supabase/client';
import DisabilityForm from '@/components/form/DisabilityForm';
import ElderlyForm from '@/components/form/ElderlyForm';
import WelfareForm from '@/components/form/WelfareForm';
import { DisabilityFormData } from '@/types/disability';
import { ElderlyFormData } from '@/types/elderly';
import { WelfareFormData } from '@/types/welfare';
import LoadingScreen from '@/components/ui/LoadingScreen'; // 👈 เพิ่มบรรทัดนี้

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-2xl" />,
});

export default function EditPersonPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [staffCode, setStaffCode] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [registryData, setRegistryData] = useState<any>(null);
  const [coords, setCoords] = useState({ lat: 19.1750, lng: 99.9150 });
  const [vulns, setVulns] = useState<Set<VulnType>>(new Set());
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
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
    const code = sessionStorage.getItem('staff_code');
    if (!code) { router.replace('/login'); return; }
    setStaffCode(code);
    fetchRecord();
  }, [id, router]);

  const fetchRecord = async () => {
    try {
      const { data, error } = await supabase().from('vulnerable_persons').select('*').eq('id', id).single();
      if (error || !data) throw new Error('ไม่พบข้อมูล');

      setNationalId(data.national_id || '');
      setRegistryData({
        prefix: data.prefix,
        first_name: data.first_name,
        last_name: data.last_name,
        birth_date: data.birth_date,
        address: data.note || '',
      });
      setCoords({ lat: data.latitude, lng: data.longitude });
      setVulns(new Set(data.vulnerabilities || []));
      setPhone(data.phone || '');
      setNote(data.note || '');
      setPhotos(data.photo_urls || []);
      
      if (data.disability_profile) setDisabilityData({ ...disabilityData, ...data.disability_profile, adlScores: data.disability_profile.adlScores || {} });
      if (data.elderly_profile) setElderlyData({ ...elderlyData, ...data.elderly_profile, adlScores: data.elderly_profile.adlScores || {}, tgdsScores: data.elderly_profile.tgdsScores || {} });
      if (data.welfare_profile) setWelfareData({ ...welfareData, ...data.welfare_profile });
      
    } catch (err) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      router.push('/person/my-records');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (photos.length + files.length > 3) return toast.error('อัปโหลดได้สูงสุด 3 รูป');
    setPhotos((prev) => [...prev, ...Array.from(files).map((file) => URL.createObjectURL(file))]);
  };

  const toggleVuln = (type: VulnType) => {
    setVulns((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const handleUpdate = async () => {
    if (vulns.size === 0) return toast.error('กรุณาเลือกประเภทกลุ่มเปราะบางอย่างน้อย 1 ประเภท');
    
    setIsSaving(true);
    try {
      const { error } = await supabase().from('vulnerable_persons').update({
        phone: phone,
        latitude: coords.lat, 
        longitude: coords.lng, 
        photo_urls: photos,
        note: note, 
        vulnerabilities: Array.from(vulns), 
        disability_type: disabilityData.disabilityType || null,
        disability_profile: vulns.has('DISABLED') ? disabilityData : null,
        elderly_profile: vulns.has('ELDERLY') ? elderlyData : null,
        welfare_profile: (vulns.has('LOW_INCOME') || vulns.has('BEDRIDDEN') || vulns.has('PREGNANT')) ? welfareData : null,
      }).eq('id', id);

      if (error) throw error;
      toast.success('อัปเดตข้อมูลสำเร็จ!');
      router.push('/person/my-records');
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดต');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <main className="min-h-screen bg-gradient-soft pb-20">
      
      <div className="sticky top-0 z-[100] bg-white/90 backdrop-blur-xl border-b border-white/60">
        <div className="max-w-4xl mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button onClick={() => router.back()} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-sm border border-slate-100 p-0.5 shrink-0 hidden sm:block">
               <Image src="/logo.png" alt="logo" width={40} height={40} className="object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 text-sm md:text-lg truncate">แก้ไขข้อมูล</h1>
              <p className="text-[10px] md:text-[11px] text-sky-600 font-medium flex items-center gap-1 truncate mt-0.5">
                <ShieldCheck className="w-3 h-3 shrink-0" /> <span className="truncate">แก้ไขโดย: {staffCode}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
             <button 
              onClick={() => { sessionStorage.clear(); router.replace('/'); }} 
              className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4 mt-2">
        <section className="bg-slate-100 rounded-3xl p-5 border border-slate-200">
          <h2 className="font-bold text-slate-500 mb-2 text-sm uppercase tracking-wide">ข้อมูลจากทะเบียนราษฎร (ไม่สามารถแก้ไขได้)</h2>
          <p className="text-lg font-bold text-slate-800">{registryData?.prefix}{registryData?.first_name} {registryData?.last_name}</p>
          <p className="text-sm text-slate-500">เลขบัตร: {nationalId}</p>
        </section>

        <section className="bg-white rounded-3xl p-5 shadow-soft border border-white/60">
          <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">1</span> พิกัดบ้าน
          </h2>
          <LocationPicker position={coords} setPosition={setCoords} />
        </section>

        <section className="bg-white rounded-3xl p-5 shadow-soft border border-white/60">
          <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">2</span> ข้อมูลกลุ่มเปราะบาง
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">ประเภท</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(Object.keys(VULN) as VulnType[]).map((key) => {
                  const meta = VULN[key]; const isActive = vulns.has(key);
                  return (
                    <button key={key} type="button" onClick={() => toggleVuln(key)} className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${isActive ? 'border-transparent text-white shadow-md' : 'border-slate-100 bg-slate-50 text-slate-600'}`} style={isActive ? { backgroundColor: meta.color } : undefined}>
                      <span className="text-xl">{meta.emoji}</span><span className="text-sm font-medium flex-1">{meta.label}</span>{isActive && <Check className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {vulns.has('DISABLED') && (
              <div className="mt-6 border-t pt-4"><DisabilityForm data={disabilityData} onChange={setDisabilityData} /></div>
            )}
            {vulns.has('ELDERLY') && (
              <div className="mt-6 border-t pt-4"><ElderlyForm data={elderlyData} onChange={setElderlyData} /></div>
            )}
            {(vulns.has('LOW_INCOME') || vulns.has('BEDRIDDEN') || vulns.has('PREGNANT')) && (
              <div className="mt-6 border-t pt-4"><WelfareForm data={welfareData} onChange={setWelfareData} /></div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-sky-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-sky-400 resize-none" />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-5 shadow-soft border border-white/60">
          <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">3</span> รูปถ่าย (สูงสุด 3 รูป)
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {photos.map((url, i) => (
              <div key={i} className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-slate-200">
                <img src={url} alt="preview" className="w-full h-full object-cover" />
                <button onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center text-white"><X className="w-3 h-3" /></button>
              </div>
            ))}
            {photos.length < 3 && (
              <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 shrink-0 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-sky-400 hover:text-sky-500">
                <ImagePlus className="w-6 h-6 mb-1" /><span className="text-xs font-medium">เพิ่มรูป</span>
              </button>
            )}
            <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
          </div>
        </section>

        <button onClick={handleUpdate} disabled={isSaving} className="w-full h-14 rounded-2xl bg-sky-500 text-white font-bold text-lg shadow-[0_8px_32px_rgba(14,165,233,0.35)] hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 mt-6 disabled:opacity-70">
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-6 h-6" />}
          บันทึกการแก้ไข
        </button>
      </div>
    </main>
  );
}