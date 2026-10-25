'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { KeyRound, UserCircle, LogIn, ArrowLeft } from 'lucide-react'; // 👈 เอา Loader2 ออก
import { toast } from 'sonner';
import { getUsers } from '@/lib/auth';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');

  const handleLogin = async (e: React.FormEvent) => { // 👈 ใส่ async
    e.preventDefault();
    if (!username.trim()) return toast.error('กรุณากรอกรหัสผู้ใช้');
    setIsLoading(true);

    try {
      const users = await getUsers(); // 👈 ใส่ await
      const user = users.find(u => u.username === username && u.password === password);

      if (!user) {
        toast.error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem('staff_code', user.username);
      sessionStorage.setItem('staff_role', user.role);
      sessionStorage.setItem('staff_name', user.name);
      if (user.area) sessionStorage.setItem('staff_area', user.area);
      
      setWelcomeName(user.name);
      setShowSuccessModal(true);
      
      setTimeout(() => {
        if (user.role === 'SUPERADMIN') window.location.href = '/admin';
        else if (user.role === 'MUNICIPALITY') window.location.href = '/map';
        else if (user.role === 'OSM') window.location.href = '/person/new';
      }, 2500); 
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setIsLoading(false);
    }
  };
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      <div className="absolute top-6 left-6 z-[100]">
        <a href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium bg-white/80 px-4 py-2 rounded-full backdrop-blur-md transition-colors shadow-sm border border-white/50">
          <ArrowLeft className="w-4 h-4" /> กลับหน้าแรก
        </a>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        
        <div className="text-center mb-10 relative mt-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-tr from-pink-400 to-sky-400 rounded-full blur-[60px] opacity-40 animate-pulse pointer-events-none" />
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative w-32 h-32 bg-white rounded-full shadow-[0_0_40px_rgba(236,72,153,0.3)] p-0 mx-auto mb-6 flex items-center justify-center z-10 overflow-hidden">
            <Image src="/logo.png" alt="Logo" width={128} height={128} className="object-contain w-full h-full" priority />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-sky-600 z-10 relative drop-shadow-sm">
            เข้าสู่ระบบเจ้าหน้าที่
          </h1>
        </div>

        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/60">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อผู้ใช้ (Username)</label>
              <div className="relative group">
                <UserCircle className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-pink-500" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin, mun, osm" className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium text-slate-800" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">รหัสผ่าน</label>
              <div className="relative group">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-pink-500" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium text-slate-800" />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full h-14 mt-2 rounded-xl bg-gradient-to-r from-pink-500 to-sky-500 text-white font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              {isLoading ? 'กำลังตรวจสอบ...' : <><LogIn className="w-5 h-5" /> เข้าสู่ระบบ</>}
            </button>
          </form>
          <div className="mt-6 text-center text-xs text-slate-400 space-y-1">
            <p>Admin: <strong>admin / 123</strong></p>
            <p>เทศบาล: <strong>mun / 123</strong></p>
            <p>อสม.: <strong>osm / 123</strong></p>
          </div>
        </div>
      </motion.div>

      {/* Modal ยินดีต้อนรับ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
          >
            <div className="relative w-28 h-28 mx-auto mb-6">
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                className="w-full h-full bg-white rounded-full border-4 border-pink-50 p-2 shadow-xl flex items-center justify-center relative z-10"
              >
                <Image src="/logo.png" alt="Logo" width={80} height={80} className="object-contain" />
              </motion.div>
            </div>

            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-2xl font-bold text-slate-800 mb-2">
              เข้าสู่ระบบสำเร็จ
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-slate-500 mb-6">
              ยินดีต้อนรับ<br/><span className="font-bold text-pink-600 text-lg">{welcomeName}</span>
            </motion.p>
            
            {/* 👇 เหลือแค่แถบโหลด 👇 */}
            <div className="w-full bg-sky-50 rounded-full h-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: "100%" }} 
                transition={{ duration: 2.3, ease: "easeInOut" }}
                className="bg-gradient-to-r from-pink-500 to-sky-500 h-full rounded-full"
              />
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}