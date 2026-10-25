'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import { getUsers, saveUser, deleteUser, type AppUser, type Role } from '@/lib/auth';
import { checkAuth } from '@/lib/auth';
import { Trash2, User, MapPin, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminContent() {
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AppUser>>({ role: 'OSM' });

  useEffect(() => {
    const auth = checkAuth(['SUPERADMIN']);
    if (!auth) { router.push('/login'); return; }
    loadUsers();

    const handleOpenModal = () => {
      setFormData({ role: 'OSM' });
      setIsModalOpen(true);
    };
    window.addEventListener('openAddUserModal', handleOpenModal);

    return () => window.removeEventListener('openAddUserModal', handleOpenModal);
  }, [router]);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await getUsers();
    setUsers(data);
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.name) return toast.error('กรอกข้อมูลให้ครบ');
    if (formData.role === 'OSM' && !formData.area) return toast.error('กรุณาระบุหมู่บ้านที่ดูแล');
    
    try {
      await saveUser(formData as AppUser);
      toast.success('บันทึกข้อมูลผู้ใช้สำเร็จ');
      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (username === 'admin') return toast.error('ไม่สามารถลบ Superadmin หลักได้');
    if (confirm('ยืนยันการลบผู้ใช้นี้?')) {
      try {
        await deleteUser(id);
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
        ) : (
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
                    u.role === 'SUPERADMIN' ? 'bg-pink-100 text-pink-700' :
                    u.role === 'MUNICIPALITY' ? 'bg-sky-100 text-sky-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {u.role}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-slate-50 pt-3 mt-1">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>พื้นที่: <span className="font-medium text-slate-800">{u.area || '-'}</span></span>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(u.id!, u.username)} 
                    className="flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-1.5 rounded-xl md:rounded-lg text-xs font-medium transition-colors shrink-0"
                    title="ลบผู้ใช้"
                  >
                    <Trash2 className="w-5 h-5 md:w-4 md:h-4" /> 
                    <span className="hidden md:inline ml-1.5">ลบ</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal เพิ่ม/แก้ไข User (เหมือนเดิม) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-slate-800">{formData.id ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">ชื่อ-นามสกุล</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Username</label>
                <input type="text" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400" disabled={formData.username === 'admin'}/>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">รหัสผ่าน</label>
                <input type="text" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">สิทธิ์การใช้งาน</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role, area: e.target.value !== 'OSM' ? '' : formData.area})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400">
                  <option value="OSM">อสม. (ระดับ 1)</option>
                  <option value="MUNICIPALITY">เทศบาล (ระดับ 2)</option>
                  <option value="SUPERADMIN">Superadmin</option>
                </select>
              </div>
              
              {formData.role === 'OSM' && (
                <div className="animate-slide-up">
                  <label className="text-sm font-medium text-pink-600">พื้นที่รับผิดชอบ (หมู่ที่)</label>
                  <select value={formData.area || ''} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full mt-1 p-3 bg-pink-50 border border-pink-200 rounded-xl outline-none focus:border-pink-400 font-medium">
                    <option value="">-- เลือกหมู่บ้าน --</option>
                    {Array.from({ length: 14 }).map((_, i) => (
                      <option key={i+1} value={`หมู่ ${i + 1}`}>หมู่ {i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-600 transition-colors">ยกเลิก</button>
                <button type="submit" className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold shadow-md transition-colors">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}