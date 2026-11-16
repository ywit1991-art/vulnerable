// src/app/admin/AdminContent.tsx
'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import { getUsers, saveUser, deleteUser, type AppUser, type Role, checkAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import { Trash2, User, Loader2, ShieldAlert, History, CheckCircle2, X, Edit } from 'lucide-react'; // 👈 เพิ่ม Edit icon
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'users';
  
  const [users, setUsers] = useState<AppUser[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AppUser>>({ role: 'staff' });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const auth = checkAuth(['Admin']);
    if (!auth) { router.push('/'); return; }

    if (activeTab === 'users') loadUsers();
    else loadLogs();

    const handleOpenModal = () => {
      setFormData({ role: 'staff' });
      setFirstName('');
      setLastName('');
      setIsModalOpen(true);
    };
    window.addEventListener('openAddUserModal', handleOpenModal);
    return () => window.removeEventListener('openAddUserModal', handleOpenModal);
  }, [router, activeTab]);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await getUsers();
    setUsers(data);
    setIsLoading(false);
  };

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase().from('audit_logs').select('*').order('created_at', { ascending: false });
      if (data) setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 👇 ฟังก์ชันสำหรับเปิด Modal แก้ไข 👇
  const handleEditClick = (userToEdit: AppUser) => {
    setFormData(userToEdit);
    // แยกชื่อและนามสกุล (ถ้ามีช่องว่าง)
    const nameParts = userToEdit.name.split(' ');
    setFirstName(nameParts[0] || '');
    setLastName(nameParts.slice(1).join(' ') || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !firstName || !lastName) {
      return toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
    
    try {
      const payload = {
        ...formData,
        name: `${firstName} ${lastName}`
      };

      await saveUser(payload as AppUser);
      
      await supabase().from('audit_logs').insert([{
        action: formData.id ? 'EDIT_USER' : 'ADD_USER',
        details: `ชื่อผู้ใช้: ${formData.username} (${payload.name})`,
        performed_by: sessionStorage.getItem('staff_name') || 'Admin'
      }]);

      setSuccessMessage(formData.id ? 'แก้ไขข้อมูลผู้ใช้สำเร็จ' : 'เพิ่มผู้ใช้ใหม่สำเร็จ');
      setIsModalOpen(false); 
      setShowSuccessModal(true); 
      
      loadUsers();
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (username === 'Admin') return toast.error('ไม่สามารถลบ Admin หลักได้');
    if (confirm('ยืนยันการลบผู้ใช้นี้?')) {
      try {
        await deleteUser(id);
        await supabase().from('audit_logs').insert([{
          action: 'DELETE_USER',
          details: `ลบผู้ใช้: ${username}`,
          performed_by: sessionStorage.getItem('staff_name') || 'Admin'
        }]);
        toast.success('ลบผู้ใช้แล้ว');
        loadUsers();
      } catch (err) {
        toast.error('ไม่สามารถลบได้');
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
        ) : activeTab === 'users' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {users.map((u) => (
              <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{u.name}</h3>
                      <p className="text-xs text-slate-500">@{u.username}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    u.role === 'Admin' ? 'bg-pink-100 text-pink-700' :
                    u.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                    u.role === 'officer' ? 'bg-sky-100 text-sky-700' : 
                    u.role === 'staff' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {u.role}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-t border-slate-50 pt-3 mt-1">
                  {/* 👇 แสดงรหัสผ่านชัดเจน 👇 */}
                  <span className="text-xs text-slate-500">
                    รหัสผ่าน: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{u.password}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* 👇 เพิ่มปุ่มแก้ไข 👇 */}
                    <button onClick={() => handleEditClick(u)} className="text-sky-600 bg-sky-50 hover:bg-sky-100 p-1.5 rounded-lg transition-colors shrink-0" title="แก้ไข">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(u.id!, u.username)} className="text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5" title="ลบ">
                      <Trash2 className="w-4 h-4" /> 
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-sky-500" /> บันทึกประวัติการใช้งานระบบ
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">ยังไม่มีประวัติการทำรายการ</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-sky-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{log.action}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{log.details}</p>
                      <div className="flex gap-3 text-xs text-slate-400 mt-2">
                        <span>โดย: {log.performed_by}</span>
                        <span>•</span>
                        <span>{new Date(log.created_at).toLocaleString('th-TH')}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal เพิ่ม/แก้ไข User */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4 text-slate-800">{formData.id ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">ชื่อ</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400" placeholder="สมชาย" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">นามสกุล</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400" placeholder="ใจดี" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Username (ใช้ล็อกอิน)</label>
                  <input type="text" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400" disabled={formData.username === 'Admin'}/>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700">รหัสผ่าน</label>
                  {/* 👇 เปลี่ยน type เป็น text เพื่อให้เห็นพาสเวิร์ด 👇 */}
                  <input type="text" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400 font-mono" placeholder="ตั้งรหัสผ่าน..." />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">บทบาท (Role)</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400">
                    <option value="trainee">trainee (นักศึกษาฝึกงาน)</option>
                    <option value="staff">staff (เจ้าหน้าที่)</option>
                    <option value="officer">officer (เจ้าหน้าที่ดูแผนที่)</option>
                    <option value="manager">manager (ผู้จัดการ)</option>
                    <option value="Admin">Admin (ผู้ดูแลระบบ)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-600 transition-colors">ยกเลิก</button>
                  <button type="submit" className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold shadow-md transition-colors">บันทึก</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Success Modal */}
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

              <h2 className="text-xl font-bold text-slate-800 mb-2">สำเร็จ!</h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                {successMessage}
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