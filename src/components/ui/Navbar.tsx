// src/components/ui/Navbar.tsx
'use client';
import Link from 'next/link';
import { LogIn, LogOut, List, User, Plus, Printer, History, MapPin, Settings, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  const currentTab = searchParams.get('tab') || 'users';

  useEffect(() => {
    const role = sessionStorage.getItem('staff_role');
    if (role) {
      setUser({
        role,
        name: sessionStorage.getItem('staff_name') || '',
        area: sessionStorage.getItem('staff_area') || '',
      });
    }
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, searchParams]);

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/';
  };

  const isReportPage = pathname === '/municipality/report';
  const isAdminPage = pathname === '/admin';
  
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  
  const canAddData = ['trainee', 'staff', 'officer'].includes(user?.role) || isAdmin;
  const canViewData = ['trainee', 'staff', 'officer'].includes(user?.role) || isAdmin;
  const canViewMap = ['officer', 'manager'].includes(user?.role) || isAdmin;

  return (
    <nav className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-50 print:hidden relative">
      <div className="max-w-[1400px] mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        
        {/* Logo & Title */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full border border-slate-100 p-0.5 shrink-0 flex items-center justify-center">
             <Image src="/logo.png" alt="logo" width={36} height={36} className="object-contain" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-slate-800 text-xs sm:text-sm md:text-base leading-tight truncate">ข้อมูลกลุ่มเปราะบาง</h1>
            <p className="text-[9px] sm:text-[10px] md:text-xs text-pink-600 font-medium truncate">เทศบาลตำบลท่าวังทอง</p>
          </div>
        </div>
        
        {/* 👇 เมนูสำหรับหน้าจอคอมพิวเตอร์ (Desktop) 👇 */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg mr-1">
              <User className="w-3.5 h-3.5 text-pink-600" />
              <span className="text-xs font-bold text-slate-700">{user.name}</span>
              <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded uppercase">{user.role}</span>
            </div>
          )}

          {isAdmin && !isAdminPage && (
            <Link href="/admin" className="bg-pink-500 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-pink-600 transition-colors shadow-sm">
              <Settings className="w-4 h-4" /> <span className="text-sm font-medium">จัดการระบบ</span>
            </Link>
          )}

          {isAdmin && isAdminPage && (
            <>
              <Link href="/admin?tab=users" className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium text-sm ${currentTab === 'users' ? 'bg-pink-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <User className="w-4 h-4" /> จัดการบัญชี
              </Link>
              <Link href="/admin?tab=logs" className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium text-sm ${currentTab === 'logs' ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <History className="w-4 h-4" /> ประวัติ
              </Link>
              <button onClick={() => window.dispatchEvent(new Event('openAddUserModal'))} className="bg-pink-50 text-pink-600 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-pink-100 transition-colors font-bold text-sm">
                <Plus className="w-4 h-4" /> เพิ่มผู้ใช้
              </button>
            </>
          )}

          {canAddData && pathname !== '/person/new' && (
            <Link href="/person/new" className="bg-pink-50 text-pink-600 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-pink-100 transition-colors">
              <Plus className="w-4 h-4" /> <span className="text-sm font-medium">เพิ่มข้อมูล</span>
            </Link>
          )}

          {canViewData && (
            <Link href="/person/my-records" className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
              <List className="w-4 h-4" /> <span className="text-sm font-medium">ดูข้อมูล</span>
            </Link>
          )}

          {canViewMap && pathname !== '/map' && (
            <Link href="/map" className="bg-sky-50 text-sky-600 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-sky-100 transition-colors">
              <MapPin className="w-4 h-4" /> <span className="text-sm font-medium">ดูแผนที่</span>
            </Link>
          )}

          {isReportPage && (
            <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors">
              <Printer className="w-4 h-4" /> <span className="text-sm">พิมพ์รายงาน</span>
            </button>
          )}

          {user ? (
            <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors ml-2">
              <LogOut className="w-4 h-4" /> <span className="text-sm font-medium">ออกจากระบบ</span>
            </button>
          ) : (
            <Link href="/" className="bg-gradient-to-r from-pink-500 to-sky-500 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 shadow-md">
              <LogIn className="w-4 h-4" /> <span className="text-sm font-medium">เข้าสู่ระบบ</span>
            </Link>
          )}
        </div>

        {/* 👇 เมนูสำหรับหน้าจอมือถือ (Mobile) 👇 */}
        <div className="md:hidden flex items-center gap-2 shrink-0">
          {user && (
             <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-1 rounded font-bold uppercase">{user.role}</span>
          )}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 👇 Dropdown Menu สำหรับมือถือ (จัดเป็น Grid ไอคอน) 👇 */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full left-0 top-14 overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-4">
              
              {/* ข้อมูลผู้ใช้ */}
              {user && (
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{user.name}</p>
                    <p className="text-[10px] text-slate-500">{user.role}</p>
                  </div>
                </div>
              )}

              {/* กลุ่มเมนูแอดมิน */}
              {isAdmin && isAdminPage && (
                <div className="grid grid-cols-3 gap-2 pb-3 border-b border-slate-100">
                  <Link href="/admin?tab=users" className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${currentTab === 'users' ? 'bg-pink-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                    <User className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-medium">บัญชี</span>
                  </Link>
                  <Link href="/admin?tab=logs" className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${currentTab === 'logs' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                    <History className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-medium">ประวัติ</span>
                  </Link>
                  <button onClick={() => window.dispatchEvent(new Event('openAddUserModal'))} className="flex flex-col items-center justify-center p-3 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors">
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-bold">เพิ่มผู้ใช้</span>
                  </button>
                </div>
              )}

              {/* กลุ่มเมนูการทำงานหลัก */}
              <div className="grid grid-cols-3 gap-2">
                {isAdmin && !isAdminPage && (
                  <Link href="/admin" className="flex flex-col items-center justify-center p-3 rounded-xl bg-pink-500 text-white shadow-sm">
                    <Settings className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-medium">จัดการระบบ</span>
                  </Link>
                )}

                {canAddData && pathname !== '/person/new' && (
                  <Link href="/person/new" className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100">
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-medium">เพิ่มข้อมูล</span>
                  </Link>
                )}

                {canViewData && (
                  <Link href="/person/my-records" className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100">
                    <List className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-medium">ดูข้อมูล</span>
                  </Link>
                )}

                {canViewMap && pathname !== '/map' && (
                  <Link href="/map" className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100">
                    <MapPin className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-medium">ดูแผนที่</span>
                  </Link>
                )}

                {isReportPage && (
                  <button onClick={() => window.print()} className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 text-white">
                    <Printer className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-medium">พิมพ์</span>
                  </button>
                )}
              </div>

              {/* ปุ่มออกจากระบบ */}
              {user && (
                <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 p-3 rounded-xl flex items-center justify-center gap-2 font-bold mt-1">
                  <LogOut className="w-5 h-5" /> ออกจากระบบ
                </button>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}