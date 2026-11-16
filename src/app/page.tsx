// src/app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, UserCircle, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react'; // 👈 เพิ่ม Eye, EyeOff
import { getUsers } from '@/lib/auth';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 👇 State สำหรับเปิด/ปิดการมองเห็นรหัสผ่าน 👇
  const [showPassword, setShowPassword] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('กรุณากรอกรหัสผู้ใช้');
      setShowErrorModal(true);
      return;
    }
    setIsLoading(true);

    try {
      const users = await getUsers();
      const user = users.find(u => u.username === username && u.password === password);

      if (!user) {
        setErrorMessage('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        setShowErrorModal(true);
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
        if (user.role === 'Admin') {
          window.location.href = '/admin'; 
        } else if (user.role === 'officer' || user.role === 'manager') {
          window.location.href = '/map'; 
        } else {
          window.location.href = '/person/new'; 
        }
      }, 2500); 
    } catch (error) {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      setShowErrorModal(true);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
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
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="กรอกชื่อผู้ใช้" className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium text-slate-800" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">รหัสผ่าน</label>
              <div className="relative group">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-pink-500" />
                {/* 👇 เปลี่ยน type ตาม State และเพิ่ม pr-12 เพื่อเว้นที่ให้ไอคอนตา 👇 */}
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium text-slate-800" 
                />
                
                {/* 👇 ปุ่มดวงตาสำหรับสลับการมองเห็นรหัสผ่าน 👇 */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
                  title={showPassword ? "ซ่อนรหัสผ่าน" : "ดูรหัสผ่าน"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full h-14 mt-2 rounded-xl bg-gradient-to-r from-pink-500 to-sky-500 text-white font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              {isLoading ? 'กำลังตรวจสอบ...' : <><LogIn className="w-5 h-5" /> เข้าสู่ระบบ</>}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Error Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowErrorModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 relative">
                <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20"></div>
                <AlertCircle className="w-10 h-10 text-red-500 relative z-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">เข้าสู่ระบบไม่สำเร็จ</h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">{errorMessage}</p>
              <button onClick={() => setShowErrorModal(false)} className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">ลองใหม่อีกครั้ง</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
              <div className="relative w-28 h-28 mx-auto mb-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="w-full h-full bg-white rounded-full border-4 border-pink-50 p-2 shadow-xl flex items-center justify-center relative z-10">
                  <Image src="/logo.png" alt="Logo" width={80} height={80} className="object-contain" />
                </motion.div>
              </div>
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-2xl font-bold text-slate-800 mb-2">เข้าสู่ระบบสำเร็จ</motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-slate-500 mb-6">ยินดีต้อนรับ<br/><span className="font-bold text-pink-600 text-lg">{welcomeName}</span></motion.p>
              <div className="w-full bg-sky-50 rounded-full h-2 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.3, ease: "easeInOut" }} className="bg-gradient-to-r from-pink-500 to-sky-500 h-full rounded-full" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}