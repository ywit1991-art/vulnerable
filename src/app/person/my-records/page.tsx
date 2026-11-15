// src/app/person/my-records/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import { checkAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Edit, Plus, History, Loader2, Trash2, AlertTriangle, CheckCircle2, X, HeartHandshake, Phone } from 'lucide-react';
import { VULN, type VulnType } from '@/lib/constants';
import InterventionModal from '@/components/form/InterventionModal';
import InterventionHistoryModal from '@/components/form/InterventionHistoryModal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// 👇 ฟังก์ชันจัดรูปแบบเบอร์โทรศัพท์ 👇
const formatPhone = (phone: string) => {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, ''); // ตัดอักขระที่ไม่ใช่ตัวเลขออก
  if (digits.length === 10) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`; // 0x-xxxx-xxxx
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`; // 0-xxxx-xxxx
  }
  return phone; 
};

// 👇 ฟังก์ชันจัดรูปแบบเบอร์โทรที่อยู่ในข้อความ (กรณีข้อมูลเก่า) 👇
const formatPhoneInText = (text: string) => {
  if (!text) return text;
  return text.replace(/(\d{9,10})/g, (match) => formatPhone(match));
};

const parseNote = (note: string) => {
  const result = { needs: '', emergency: '', landmark: '', other: '' };
  if (!note) return result;

  const lines = note.split('\n');
  const otherLines = [];

  for (const line of lines) {
    if (line.includes('[ความต้องการ]:')) {
      result.needs = line.replace('[ความต้องการ]:', '').trim();
    } else if (line.includes('[ติดต่อฉุกเฉิน]:')) {
      result.emergency = line.replace('[ติดต่อฉุกเฉิน]:', '').trim();
    } else if (line.includes('จุดสังเกต:')) {
      result.landmark = line.replace('จุดสังเกต:', '').trim();
    } else if (line.trim() !== '') {
      otherLines.push(line.trim());
    }
  }
  result.other = otherLines.join(', ');
  return result;
};

export default function MyRecordsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [historyPerson, setHistoryPerson] = useState<any>(null);
  
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const auth = checkAuth(['trainee', 'staff', 'officer', 'Admin']);
    if (!auth) { window.location.href = '/'; return; }
    setUser(auth);
    fetchRecords(auth.username || '', auth.role); 
  }, []);

  const fetchRecords = async (username: string, role: string) => {
    setIsLoading(true);
    try {
      let query = supabase()
        .from('vulnerable_persons')
        .select('*, interventions(*)')
        .order('created_at', { ascending: false });

      if (role === 'trainee' || role === 'staff') {
        query = query.eq('created_by', username);
      }

      const { data, error } = await query;
      if (data) setRecords(data);
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    
    try {
      await supabase().from('interventions').delete().eq('person_id', deleteTarget.id);
      const { error } = await supabase().from('vulnerable_persons').delete().eq('id', deleteTarget.id);
      
      if (error) throw error;
      
      setSuccessMessage(`ลบข้อมูลของ ${deleteTarget.name} เรียบร้อยแล้ว`);
      setDeleteTarget(null); 
      setShowSuccessModal(true);
      
      fetchRecords(user.username || '', user.role);
      
      setTimeout(() => setShowSuccessModal(false), 2500);

    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRecords = records.filter((r: any) => 
    `${r.first_name} ${r.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 mt-6">
        
        <div className="relative mb-6">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="ค้นหาชื่อ..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-pink-400 shadow-sm" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-4xl mb-4">📂</p>
            <h3 className="text-lg font-bold text-slate-800 mb-2">ไม่พบข้อมูล</h3>
            <p className="text-slate-500 text-sm mb-6">คุณยังไม่ได้บันทึกข้อมูล หรือค้นหาไม่พบ</p>
            <button onClick={() => router.push('/person/new')} className="bg-pink-500 text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:scale-105 transition-transform">
              + เพิ่มข้อมูลใหม่
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record: any) => {
              const parsedNote = parseNote(record.note);

              return (
                <div key={record.id} className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 break-words whitespace-normal">
                        {record.prefix}{record.first_name} {record.last_name}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {record.vulnerabilities?.map((v: string) => (
                          <span key={v} className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: VULN[v as VulnType]?.color }}>
                            {VULN[v as VulnType]?.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 md:gap-2 shrink-0 md:justify-end">
                      {record.interventions && record.interventions.length > 0 && (
                        <button onClick={() => setHistoryPerson(record)} className="flex-1 md:flex-none px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 flex items-center justify-center gap-1.5 transition-colors" title="ประวัติ">
                          <History className="w-4 h-4" />
                          <span className="text-xs font-medium md:inline hidden">ประวัติ</span>
                        </button>
                      )}
                      <button onClick={() => setSelectedPerson(record)} className="flex-1 md:flex-none px-3 py-2 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-100 flex items-center justify-center gap-1.5 transition-colors" title="ช่วยเหลือ">
                        <Plus className="w-4 h-4" />
                        <span className="text-xs font-medium md:inline hidden">ช่วยเหลือ</span>
                      </button>
                      <button onClick={() => router.push(`/person/edit/${record.id}`)} className="flex-1 md:flex-none px-3 py-2 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-100 flex items-center justify-center gap-1.5 transition-colors" title="แก้ไข">
                        <Edit className="w-4 h-4" />
                        <span className="text-xs font-medium md:inline hidden">แก้ไข</span>
                      </button>
                      
                      {(user.role === 'Admin' || record.created_by === user.username) && (
                        <button onClick={() => handleDeleteClick(record.id, `${record.first_name} ${record.last_name}`)} className="flex-1 md:flex-none px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex items-center justify-center gap-1.5 transition-colors" title="ลบข้อมูล">
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs font-medium md:hidden lg:inline hidden">ลบ</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-50 space-y-2">
                    <p className="text-sm text-slate-600 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> 
                      <span>
                        บ้านเลขที่ {record.house_no || '-'} หมู่ {record.village_no || '-'} 
                        {parsedNote.landmark && <span className="text-slate-400"> ({parsedNote.landmark})</span>}
                      </span>
                    </p>

                    {/* 👇 แสดงเบอร์โทรศัพท์แบบฟอร์แมตใหม่ 👇 */}
                    {record.emergency_phone ? (
                      <p className="text-sm text-slate-600 flex items-start gap-1.5">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> 
                        <span>ติดต่อฉุกเฉิน: {record.close_person_name || 'ไม่ระบุชื่อ'} ({formatPhone(record.emergency_phone)})</span>
                      </p>
                    ) : parsedNote.emergency ? (
                      <p className="text-sm text-slate-600 flex items-start gap-1.5">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> 
                        <span>ติดต่อฉุกเฉิน: {formatPhoneInText(parsedNote.emergency)}</span>
                      </p>
                    ) : null}

                    {parsedNote.needs && (
                      <div className="bg-pink-50/50 p-2.5 rounded-xl border border-pink-100 flex items-start gap-2">
                        <HeartHandshake className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-pink-600 block mb-0.5">ความต้องการ:</span>
                          <span className="text-sm text-slate-700">{parsedNote.needs}</span>
                        </div>
                      </div>
                    )}

                    {record.interventions && record.interventions.length > 0 && (
                      <p className="text-xs text-green-600 font-medium mt-2 bg-green-50 px-2 py-1 rounded inline-block">
                        ✅ ได้รับการช่วยเหลือแล้ว {record.interventions.length} ครั้ง
                      </p>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals... (เหมือนเดิม) */}
      {selectedPerson && (
        <InterventionModal 
          personId={selectedPerson.id} 
          personName={`${selectedPerson.first_name} ${selectedPerson.last_name}`} 
          staffCode={user.username || ''} 
          onClose={() => setSelectedPerson(null)} 
          onSuccess={() => fetchRecords(user.username || '', user.role)} 
        />
      )}
      
      {historyPerson && (
        <InterventionHistoryModal 
          person={historyPerson} 
          staffCode={user.username || ''} 
          onClose={() => setHistoryPerson(null)} 
          onRefresh={() => fetchRecords(user.username || '', user.role)} 
        />
      )}

      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการลบข้อมูล</h3>
              <p className="text-slate-500 mb-6 text-sm">
                คุณแน่ใจหรือไม่ที่จะลบข้อมูลของ<br/>
                <span className="font-bold text-slate-800">{deleteTarget.name}</span>?<br/>
                <span className="text-xs text-red-400">(ข้อมูลประวัติการช่วยเหลือจะถูกลบไปด้วย)</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors disabled:opacity-50">
                  ยกเลิก
                </button>
                <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50">
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ลบข้อมูล'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-[2rem] p-6 max-w-sm w-full text-center shadow-2xl relative overflow-hidden border border-white/60"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30"></div>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 relative z-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">ลบข้อมูลสำเร็จ</h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">{successMessage}</p>
              <button onClick={() => setShowSuccessModal(false)} className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-sky-500 hover:opacity-90 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
                <X className="w-5 h-5" /> ปิดหน้าต่าง
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}