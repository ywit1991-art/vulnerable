'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import { checkAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Edit, Plus, History, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { VULN, type VulnType } from '@/lib/constants';
import InterventionModal from '@/components/form/InterventionModal';
import InterventionHistoryModal from '@/components/form/InterventionHistoryModal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyRecordsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [historyPerson, setHistoryPerson] = useState<any>(null);
  
  // State สำหรับ Modal ยืนยันการลบ
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const auth = checkAuth(['OSM']);
    if (!auth) { window.location.href = '/login'; return; }
    setUser(auth);
    fetchMyRecords(auth.username || '', auth.name || ''); 
  }, []);

  const fetchMyRecords = async (username: string, name: string) => {
    setIsLoading(true);
    try {
      // 1. ค้นหาด้วย username ก่อน
      let { data, error } = await supabase()
        .from('vulnerable_persons')
        .select('*, interventions(*)')
        .eq('created_by', username) 
        .order('created_at', { ascending: false });

      // 2. ถ้าไม่เจอ ให้ลองค้นหาด้วยชื่อ-นามสกุลจริง
      if (!data || data.length === 0) {
         const { data: dataByName } = await supabase()
          .from('vulnerable_persons')
          .select('*, interventions(*)')
          .eq('created_by', name) 
          .order('created_at', { ascending: false });
         data = dataByName;
      }

      // 👇 3. ลบ Fallback ที่ดึงข้อมูลทั้งหมดออกแล้ว 👇
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
      toast.success('ลบข้อมูลสำเร็จ');
      fetchMyRecords(user.username || '', user.name || '');
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null); 
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
            {filteredRecords.map((record: any) => (
              <div key={record.id} className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                
                <div className="flex justify-between items-start gap-3 mb-3">
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

                  <div className="flex gap-1.5 md:gap-2 shrink-0">
                    {record.interventions && record.interventions.length > 0 && (
                      <button onClick={() => setHistoryPerson(record)} className="w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 flex items-center justify-center gap-1.5 transition-colors" title="ประวัติ">
                        <History className="w-4 h-4" />
                        <span className="hidden md:inline text-sm font-medium">ประวัติ</span>
                      </button>
                    )}
                    <button onClick={() => setSelectedPerson(record)} className="w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-2 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-100 flex items-center justify-center gap-1.5 transition-colors" title="ช่วยเหลือ">
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline text-sm font-medium">ช่วยเหลือ</span>
                    </button>
                    <button onClick={() => router.push(`/person/edit/${record.id}`)} className="w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-2 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-100 flex items-center justify-center gap-1.5 transition-colors" title="แก้ไข">
                      <Edit className="w-4 h-4" />
                      <span className="hidden md:inline text-sm font-medium">แก้ไข</span>
                    </button>
                    <button onClick={() => handleDeleteClick(record.id, `${record.first_name} ${record.last_name}`)} className="w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex items-center justify-center gap-1.5 transition-colors" title="ลบข้อมูล">
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline text-sm font-medium">ลบ</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-50">
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" /> {record.note || 'ไม่ระบุที่อยู่'}
                  </p>
                  {record.interventions && record.interventions.length > 0 && (
                    <p className="text-xs text-green-600 font-medium mt-2 bg-green-50 px-2 py-1 rounded inline-block">
                      ✅ ได้รับการช่วยเหลือแล้ว {record.interventions.length} ครั้ง
                    </p>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPerson && (
        <InterventionModal 
          personId={selectedPerson.id} 
          personName={`${selectedPerson.first_name} ${selectedPerson.last_name}`} 
          staffCode={user.username || ''} 
          onClose={() => setSelectedPerson(null)} 
          onSuccess={() => fetchMyRecords(user.username || '', user.name || '')} 
        />
      )}
      
      {historyPerson && (
        <InterventionHistoryModal 
          person={historyPerson} 
          staffCode={user.username || ''} 
          onClose={() => setHistoryPerson(null)} 
          onRefresh={() => fetchMyRecords(user.username || '', user.name || '')} 
        />
      )}

      {/* Custom Delete Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl"
            >
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

    </main>
  );
}