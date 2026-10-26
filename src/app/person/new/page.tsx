'use client';
import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/ui/Navbar';
import { checkAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Search, Loader2, Save, ArrowRight, ArrowLeft, 
  UserCircle, MapPin, Activity, ImagePlus, X, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

const cropAndCompressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No ctx');

        const targetRatio = 5 / 4; // 👈 เปลี่ยนเป็นแนวนอน 5:4
        let cropWidth = img.width;
        let cropHeight = img.height;
        let startX = 0;
        let startY = 0;

        if (img.width / img.height > targetRatio) {
          cropWidth = img.height * targetRatio;
          startX = (img.width - cropWidth) / 2;
        } else {
          cropHeight = img.width / targetRatio;
          startY = (img.height - cropHeight) / 2;
        }

        const maxSize = 800;
        let finalWidth = cropWidth;
        let finalHeight = cropHeight;
        if (finalWidth > maxSize) {
          finalHeight = finalHeight * (maxSize / finalWidth);
          finalWidth = maxSize;
        }

        canvas.width = finalWidth;
        canvas.height = finalHeight;
        ctx.drawImage(img, startX, startY, cropWidth, cropHeight, 0, 0, finalWidth, finalHeight);
        
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  
  if (digits.startsWith('06') || digits.startsWith('08') || digits.startsWith('09')) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  } else {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5, 9)}`;
  }
};

export default function NewPersonWizardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [nationalId, setNationalId] = useState('');
  const [registryData, setRegistryData] = useState<any>(null);
  const [coords, setCoords] = useState({ lat: 19.1750, lng: 99.9150 });
  const [isLocationLocked, setIsLocationLocked] = useState(false);
  const [selectedVulns, setSelectedVulns] = useState<Set<VulnType>>(new Set());
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const { data, error } = await supabase().from('registry_persons').select('*').eq('national_id', nationalId).single();
      
      if (error || !data) {
        toast.error('บุคคลนี้ไม่ได้อยุ่ในพื้นที่ตำบลท่าวังทอง');
        setRegistryData(null);
        return;
      }

      const osmAreaStr = String(user.area || '').replace(/\D/g, '');
      const personVillage = String(data.village_no || '').trim();

      if (osmAreaStr && personVillage && osmAreaStr !== personVillage) {
        toast.error(`บุคคลนี้ไม่ได้อยู่ในพื้นที่ ${user.area} (อยู่หมู่ ${personVillage})`, { duration: 5000 });
        setRegistryData(null);
        return;
      }

      setRegistryData(data);
      
      const addressParts = [
        data.house_no ? `${data.house_no}` : '', data.soi ? `ซอย${data.soi}` : '', data.road ? `ถนน${data.road}` : '',
        data.village_no ? `หมู่ที่ ${data.village_no}` : '', data.subdistrict ? `ต.${data.subdistrict}` : '',
        data.district ? `อ.${data.district}` : '', data.province ? `จ.${data.province}` : ''
      ].filter(Boolean);
      setNote(addressParts.join(' '));

      const { data: existingVuln } = await supabase()
        .from('vulnerable_persons')
        .select('latitude, longitude')
        .eq('national_id', nationalId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingVuln && existingVuln.length > 0 && existingVuln[0].latitude) {
        setCoords({ lat: existingVuln[0].latitude, lng: existingVuln[0].longitude });
        setIsLocationLocked(true);
        toast.success('พบประวัติเดิม: ล็อคพิกัดตามที่เคยบันทึกไว้');
      } else {
        setIsLocationLocked(false);
        toast.success('พบข้อมูลทะเบียนราษฎร');
      }
      
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSearching(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !registryData) return toast.error('กรุณาค้นหาและยืนยันข้อมูลทะเบียนราษฎรก่อน');
    if (step === 3 && selectedVulns.size === 0) return toast.error('กรุณาเลือกประเภทกลุ่มเปราะบางอย่างน้อย 1 ประเภท');
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const toggleVuln = (type: VulnType) => {
    setSelectedVulns((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (formatted.replace(/\D/g, '').length <= 10) {
      setPhone(formatted);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (photos.length + files.length > 3) return toast.error('อัปโหลดได้สูงสุด 3 รูป');
    
    try {
      const newBase64Images = await Promise.all(
        Array.from(files).map(file => cropAndCompressImage(file))
      );
      setPhotos(prev => [...prev, ...newBase64Images]);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: existingRecords } = await supabase()
        .from('vulnerable_persons')
        .select('id, vulnerabilities')
        .eq('national_id', nationalId);

      if (existingRecords && existingRecords.length > 0) {
        const isDuplicate = existingRecords.some((record: any) => 
          record.vulnerabilities && record.vulnerabilities.some((v: string) => selectedVulns.has(v as VulnType))
        );
        if (isDuplicate) {
          toast.error('บุคคลนี้ถูกบันทึกในประเภทที่เลือกไปแล้ว');
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
        phone: phone.replace(/\D/g, ''),
        photo_urls: photos,
        vulnerabilities: Array.from(selectedVulns), 
        created_by: user.username,
        disability_type: selectedVulns.has('DISABLED') ? disabilityData.disabilityType : null,
        disability_profile: selectedVulns.has('DISABLED') ? disabilityData : null,
        elderly_profile: selectedVulns.has('ELDERLY') ? elderlyData : null,
        welfare_profile: (selectedVulns.has('LOW_INCOME') || selectedVulns.has('BEDRIDDEN') || selectedVulns.has('PREGNANT')) ? welfareData : null,
      }]);

      if (error) throw error;
      toast.success('บันทึกข้อมูลสำเร็จ!');
      router.push('/person/my-records');
      
    } catch (error: any) {
      toast.error(`ข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="mb-8">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-pink-500 -z-10 rounded-full transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
            
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= num ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>
                {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] font-medium text-slate-500 mt-2 px-1">
            <span>ค้นหา</span>
            <span>พิกัด</span>
            <span>ประเมิน</span>
            <span>สรุป</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <UserCircle className="w-6 h-6 text-pink-500" /> 1. ค้นหาข้อมูลบุคคล
                </h2>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" inputMode="numeric" maxLength={13} value={nationalId} onChange={e => setNationalId(e.target.value.replace(/\D/g, ''))} placeholder="เลขบัตรประชาชน 13 หลัก" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-pink-400 font-medium" />
                  <button onClick={handleSearch} disabled={isSearching || nationalId.length !== 13} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-900 disabled:opacity-50 transition-colors">
                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />} ค้นหา
                  </button>
                </div>

                {registryData && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-sky-50 rounded-xl p-4 border border-sky-100">
                    <p className="text-sm"><span className="text-slate-500">ชื่อ-นามสกุล:</span> <strong className="text-slate-800 text-base">{registryData.prefix}{registryData.first_name} {registryData.last_name}</strong></p>
                    <p className="text-sm mt-1"><span className="text-slate-500">ที่อยู่:</span> {note}</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <MapPin className="w-6 h-6 text-pink-500" /> 2. ยืนยันพิกัดที่อยู่
                </h2>
                <p className="text-sm text-slate-500 mb-4">ปักหมุดบ้านเพื่อให้เจ้าหน้าที่สามารถลงพื้นที่ได้สะดวก</p>
                
                <LocationPicker 
                  key={isLocationLocked ? 'locked' : 'unlocked'} 
                  position={coords} 
                  setPosition={setCoords} 
                  isLocked={isLocationLocked} 
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Activity className="w-6 h-6 text-pink-500" /> 3. ประเภทและแบบประเมิน
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
                  {(Object.keys(VULN) as VulnType[]).map(key => (
                    <button key={key} onClick={() => toggleVuln(key)} className={`p-3 rounded-xl border-2 transition-all text-left flex flex-col items-center justify-center gap-1 ${selectedVulns.has(key) ? 'border-transparent text-white shadow-md' : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'}`} style={selectedVulns.has(key) ? { backgroundColor: VULN[key].color } : {}}>
                      <span className="text-2xl">{VULN[key].emoji}</span>
                      <span className="text-xs font-bold text-center leading-tight">{VULN[key].label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {selectedVulns.has('ELDERLY') && (
                    <div className="border-t pt-4 animate-slide-up">
                      <h3 className="font-bold text-purple-600 mb-3 flex items-center gap-2">👵 แบบประเมินผู้สูงอายุ</h3>
                      <ElderlyForm data={elderlyData} onChange={setElderlyData} />
                    </div>
                  )}
                  {selectedVulns.has('DISABLED') && (
                    <div className="border-t pt-4 animate-slide-up">
                      <h3 className="font-bold text-orange-500 mb-3 flex items-center gap-2">♿ แบบประเมินผู้พิการ</h3>
                      <DisabilityForm data={disabilityData} onChange={setDisabilityData} />
                    </div>
                  )}
                  {(selectedVulns.has('LOW_INCOME') || selectedVulns.has('BEDRIDDEN') || selectedVulns.has('PREGNANT')) && (
                    <div className="border-t pt-4 animate-slide-up">
                      <h3 className="font-bold text-yellow-600 mb-3 flex items-center gap-2">💰 แบบประเมินสภาพความเป็นอยู่</h3>
                      <WelfareForm data={welfareData} onChange={setWelfareData} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-pink-500" /> 4. ข้อมูลติดต่อและรูปภาพ
                </h2>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input 
                    type="tel" 
                    inputMode="tel" 
                    value={phone} 
                    onChange={handlePhoneChange} 
                    maxLength={12} 
                    placeholder="081-234-5678" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-pink-400 font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ / รายละเอียดเพิ่มเติม</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-pink-400 resize-none" placeholder="เช่น อยู่คนเดียว, บ้านไม่มีเลขที่..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">รูปถ่ายสภาพบ้าน/ผู้ป่วย (แนวนอน 5:4)</label>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {photos.map((url, i) => (
                      // 👇 เปลี่ยนกรอบ Preview เป็นแนวนอน 5:4 👇
                      <div key={i} className="relative w-24 aspect-[5/4] shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <img src={url} alt={`photo-${i}`} className="w-full h-full object-cover" />
                        <button onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center text-white z-10"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    {photos.length < 3 && (
                      <button onClick={() => fileInputRef.current?.click()} className="w-24 aspect-[5/4] shrink-0 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-pink-400 hover:text-pink-500 transition-colors">
                        <ImagePlus className="w-6 h-6 mb-1" /><span className="text-[10px] font-medium">เพิ่มรูป</span>
                      </button>
                    )}
                    <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={handleBack} className="flex-1 py-3.5 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <ArrowLeft className="w-5 h-5" /> ย้อนกลับ
            </button>
          )}
          
          {step < 4 ? (
            <button onClick={handleNext} className="flex-[2] py-3.5 bg-gradient-to-r from-pink-500 to-sky-500 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              ถัดไป <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-3.5 bg-gradient-to-r from-pink-500 to-sky-500 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} บันทึกข้อมูล
            </button>
          )}
        </div>

      </div>
    </main>
  );
}