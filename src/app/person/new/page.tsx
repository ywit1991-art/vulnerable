// src/app/person/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import { checkAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, UserCircle, MapPin, Loader2, Activity, HeartHandshake, Users, User, Phone, Calendar, CheckCircle2, X } from 'lucide-react';
import { VULN, type VulnType, NEED_OPTIONS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-2xl" />,
});

export default function NewPersonPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 👇 State สำหรับ Popup แจ้งเตือนสำเร็จ 👇
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedName, setSavedName] = useState('');

  // --- Form States ---
  const [prefix, setPrefix] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDateStr, setBirthDateStr] = useState(''); 
  const [familyMembers, setFamilyMembers] = useState<string>('1'); 
  const [phone, setPhone] = useState('');
  const [closePersonName, setClosePersonName] = useState(''); 
  const [emergencyPhone, setEmergencyPhone] = useState(''); 

  const [houseNo, setHouseNo] = useState('');
  const [villageNo, setVillageNo] = useState('');
  const [landmark, setLandmark] = useState('');
  const [coords, setCoords] = useState({ lat: 19.1750, lng: 99.9150 });

  const [selectedVulns, setSelectedVulns] = useState<Set<VulnType>>(new Set());
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [otherNeeds, setOtherNeeds] = useState(''); 

  useEffect(() => {
    const auth = checkAuth(['trainee', 'staff', 'officer', 'Admin']);
    if (!auth) {
      window.location.href = '/';
      return;
    }
    setUser(auth);
  }, []);

  // 👇 ฟังก์ชันสำหรับล้างข้อมูลในฟอร์ม (Reset Form) 👇
  const resetForm = () => {
    setPrefix('');
    setFirstName('');
    setLastName('');
    setBirthDateStr('');
    setFamilyMembers('1');
    setPhone('');
    setClosePersonName('');
    setEmergencyPhone('');
    setHouseNo('');
    setVillageNo('');
    setLandmark('');
    setCoords({ lat: 19.1750, lng: 99.9150 });
    setSelectedVulns(new Set());
    setSelectedNeeds([]);
    setOtherNeeds('');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const [year, month, day] = val.split('-');
      const beYear = parseInt(year) + 543;
      setBirthDateStr(`${day}/${month}/${beYear}`);
    } else {
      setBirthDateStr('');
    }
  };

  const parseThaiDateToISO = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    let [day, month, year] = parts;
    let y = parseInt(year);
    if (isNaN(y)) return null;
    if (y > 2400) y -= 543; 
    return `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handlePhoneChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      setter(digits);
    }
  };

  const toggleVuln = (type: VulnType) => {
    setSelectedVulns((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const toggleNeed = (need: string) => {
    setSelectedNeeds(prev =>
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    );
  };

  const handleSave = async () => {
    if (!firstName || !lastName) return toast.error('กรุณากรอกชื่อและนามสกุล');
    if (!villageNo) return toast.error('กรุณาระบุหมู่ที่');
    if (selectedVulns.size === 0) return toast.error('กรุณาเลือกประเภทกลุ่มเปราะบางอย่างน้อย 1 ประเภท');
    
    if (coords.lat === 19.1750 && coords.lng === 99.9150) {
      return toast.error('กรุณาลากหมุดหรือคลิกบนแผนที่เพื่อระบุตำแหน่งบ้านให้ชัดเจนก่อนบันทึก');
    }

    setIsSaving(true);
    try {
      const isoBirthDate = parseThaiDateToISO(birthDateStr);
      const isLivingAlone = Number(familyMembers) <= 1;

      const noteText = landmark ? `จุดสังเกต: ${landmark}` : '';
      const allNeeds = [...selectedNeeds];
      if (otherNeeds.trim()) allNeeds.push(otherNeeds.trim());
      
      const needsText = allNeeds.length > 0 ? `[ความต้องการ]: ${allNeeds.join(', ')}` : '';
      const familyText = !isLivingAlone && closePersonName ? `[ติดต่อฉุกเฉิน]: ${closePersonName} (${emergencyPhone})` : '';
      const finalNote = [noteText, familyText, needsText].filter(Boolean).join('\n');

      const { error } = await supabase().from('vulnerable_persons').insert([{
        national_id: null,
        prefix: prefix,
        first_name: firstName,
        last_name: lastName,
        birth_date: isoBirthDate, 
        phone: phone,
        family_members: Number(familyMembers) || 1,
        house_no: houseNo || null,
        village_no: villageNo || null,
        close_person_name: isLivingAlone ? null : closePersonName,
        emergency_phone: isLivingAlone ? null : emergencyPhone,
        latitude: coords.lat,
        longitude: coords.lng,
        note: finalNote,
        vulnerabilities: Array.from(selectedVulns),
        created_by: user.username,
      }]);

      if (error) throw error;

      // 👇 เมื่อบันทึกสำเร็จ: แสดง Popup และล้างฟอร์ม 👇
      setSavedName(`${firstName} ${lastName}`);
      setShowSuccessModal(true);
      resetForm(); // ล้างข้อมูลในฟอร์มเพื่อรอกรอกคนต่อไป

    } catch (error: any) {
      console.error(error);
      toast.error(`ข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;
  const isLivingAlone = Number(familyMembers) <= 1;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-4">
        
        {/* Card 1: ข้อมูลส่วนตัวและครอบครัว */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b pb-3">
            <UserCircle className="w-5 h-5 text-pink-500" /> 1. ข้อมูลส่วนตัวและครอบครัว
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">คำนำหน้า</label>
              <select value={prefix} onChange={e => setPrefix(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400">
                <option value="">เลือก...</option>
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
                <option value="ด.ช.">ด.ช.</option>
                <option value="ด.ญ.">ด.ญ.</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อ *</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" placeholder="สมชาย" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">นามสกุล *</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" placeholder="ใจดี" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">วันเดือนปีเกิด (พ.ศ.)</label>
              <div className="relative">
                <input type="text" value={birthDateStr} onChange={e => setBirthDateStr(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-sm outline-none focus:border-pink-400" placeholder="วว/ดด/ปปปป" maxLength={10}/>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded hover:bg-slate-200 transition-colors">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={handleDateChange}/>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" /> จำนวนสมาชิกในครอบครัว (รวมตัวเอง)
              </label>
              <input type="number" min="1" value={familyMembers} onChange={e => setFamilyMembers(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" placeholder="เช่น 3" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">เบอร์โทรติดต่อ (ผู้เปราะบาง)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="tel" value={phone} onChange={e => handlePhoneChange(e.target.value, setPhone)} className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" placeholder="08XXXXXXXX" maxLength={10}/>
              </div>
            </div>
          </div>

          {!isLivingAlone && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-pink-400" /> ชื่อบุคคลใกล้ชิด / ผู้ดูแล
                </label>
                <input type="text" value={closePersonName} onChange={e => setClosePersonName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" placeholder="ชื่อญาติ / ผู้ดูแล" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-pink-400" /> เบอร์โทรบุคคลใกล้ชิด
                </label>
                <input type="tel" value={emergencyPhone} onChange={e => handlePhoneChange(e.target.value, setEmergencyPhone)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" placeholder="08XXXXXXXX" maxLength={10}/>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Card 2: ที่อยู่และพิกัด */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b pb-3">
            <MapPin className="w-5 h-5 text-pink-500" /> 2. ที่อยู่และพิกัด
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">บ้านเลขที่</label>
              <input type="text" value={houseNo} onChange={e => setHouseNo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" placeholder="123/4" />
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">หมู่ที่ *</label>
              <select value={villageNo} onChange={e => setVillageNo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400">
                <option value="">เลือก...</option>
                {Array.from({ length: 14 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>หมู่ {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">จุดสังเกต (ถ้ามี)</label>
              <input type="text" value={landmark} onChange={e => setLandmark(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-pink-400" placeholder="เช่น หลังวัด, บ้านหลังสุดท้าย" />
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-2">ลากหมุดหรือคลิกบนแผนที่เพื่อระบุตำแหน่งบ้าน</p>
          <LocationPicker position={coords} setPosition={setCoords} />
          
          <div className="flex gap-2 mt-3">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2">
              <label className="block text-[10px] text-slate-500 mb-0.5">Latitude (ละติจูด)</label>
              <input type="number" step="any" value={coords.lat} onChange={(e) => setCoords({ ...coords, lat: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent text-sm text-slate-700 font-mono outline-none" />
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2">
              <label className="block text-[10px] text-slate-500 mb-0.5">Longitude (ลองจิจูด)</label>
              <input type="number" step="any" value={coords.lng} onChange={(e) => setCoords({ ...coords, lng: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent text-sm text-slate-700 font-mono outline-none" />
            </div>
          </div>
        </motion.div>

        {/* Card 3: ประเภทกลุ่มเปราะบาง */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b pb-3">
            <Activity className="w-5 h-5 text-pink-500" /> 3. ประเภทกลุ่มเปราะบาง *
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(Object.keys(VULN) as VulnType[]).map((key) => (
              <button key={key} type="button" onClick={() => toggleVuln(key)} className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 text-left ${selectedVulns.has(key) ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                <span className="text-xl">{VULN[key].emoji}</span>
                <span className="text-sm font-medium leading-tight">{VULN[key].label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Card 4: ความต้องการความช่วยเหลือ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b pb-3">
            <HeartHandshake className="w-5 h-5 text-sky-500" /> 4. ความต้องการรับความช่วยเหลือเร่งด่วน
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {NEED_OPTIONS.map((need) => (
              <label key={need} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${selectedNeeds.includes(need) ? 'bg-sky-50 border-sky-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                <input type="checkbox" checked={selectedNeeds.includes(need)} onChange={() => toggleNeed(need)} className="w-4 h-4 accent-sky-500 shrink-0" />
                <span className="text-sm text-slate-700 font-medium">{need}</span>
              </label>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุ / ความต้องการอื่นๆ (ระบุเพิ่มเติม)</label>
            <textarea value={otherNeeds} onChange={(e) => setOtherNeeds(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-sky-400 resize-none" rows={3} placeholder="ระบุรายละเอียดเพิ่มเติม..." />
          </div>
        </motion.div>

        {/* ปุ่มบันทึก */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <button onClick={handleSave} disabled={isSaving} className="w-full py-4 mt-2 bg-gradient-to-r from-pink-500 to-sky-500 text-white rounded-2xl font-bold text-lg shadow-[0_8px_30px_rgba(236,72,153,0.3)] flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50">
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />} บันทึกข้อมูล
          </button>
        </motion.div>
      </div>

      {/* 👇 Custom Success Modal (Popup แจ้งเตือนเพิ่มข้อมูลสำเร็จ) 👇 */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-[2rem] p-6 max-w-sm w-full text-center shadow-2xl relative overflow-hidden border border-white/60"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30"></div>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 relative z-10" />
              </div>

              <h2 className="text-xl font-bold text-slate-800 mb-2">บันทึกข้อมูลสำเร็จ</h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                เพิ่มข้อมูลของ <span className="font-bold text-slate-800">{savedName}</span> เรียบร้อยแล้ว<br/>
                <span className="text-xs text-slate-400 mt-2 block">คุณสามารถกรอกข้อมูลคนต่อไปได้ทันที</span>
              </p>
              
              <button 
                onClick={() => setShowSuccessModal(false)} 
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-sky-500 hover:opacity-90 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" /> ปิดหน้าต่าง
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}