'use client';
import Link from 'next/link';
import { LogIn, LogOut, List, User, Plus, Printer } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

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

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/';
  };

  const isReportPage = pathname === '/municipality/report';
  const isAdminPage = pathname === '/admin';

  return (
    <nav className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-50 print:hidden">
      <div className="max-w-[1400px] mx-auto px-2 md:px-4 h-14 md:h-16 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-2 md:gap-3 group flex-1 min-w-0">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full border border-slate-100 p-0.5 shrink-0 flex items-center justify-center">
             <Image src="/logo.png" alt="logo" width={36} height={36} className="object-contain" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-slate-800 text-[10px] sm:text-sm md:text-base leading-tight truncate">ระบบข้อมูลกลุ่มเปราะบาง</h1>
            <p className="text-[8px] sm:text-[10px] md:text-xs text-pink-600 font-medium truncate">เทศบาลตำบลท่าวังทอง</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          
          {user && (
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg mr-1">
              <User className="w-3.5 h-3.5 text-pink-600" />
              <span className="text-xs font-bold text-slate-700">{user.name}</span>
            </div>
          )}

          {/* 👇 ปุ่มเพิ่มผู้ใช้ (สำหรับหน้า Admin) 👇 */}
          {isAdminPage && user?.role === 'SUPERADMIN' && (
            <button 
              onClick={() => window.dispatchEvent(new Event('openAddUserModal'))}
              className="bg-pink-50 text-pink-600 w-9 h-9 md:w-auto md:h-auto md:px-4 md:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-pink-100 transition-colors font-bold text-sm"
              title="เพิ่มผู้ใช้"
            >
              <Plus className="w-5 h-5 md:w-4 md:h-4" /> <span className="hidden md:inline">เพิ่มผู้ใช้</span>
            </button>
          )}

          {user?.role === 'OSM' && pathname !== '/person/new' && (
            <Link href="/person/new" className="bg-pink-50 text-pink-600 w-9 h-9 md:w-auto md:h-auto md:px-4 md:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-pink-100 transition-colors" title="เพิ่มข้อมูล">
              <Plus className="w-5 h-5 md:w-4 md:h-4" /> 
              <span className="hidden md:inline text-sm font-medium">เพิ่มข้อมูล</span>
            </Link>
          )}

          {isReportPage && (
            <button onClick={() => window.print()} className="bg-slate-800 text-white w-9 h-9 md:w-auto md:h-auto md:px-4 md:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors" title="พิมพ์รายงาน">
              <Printer className="w-5 h-5 md:w-4 md:h-4" /> <span className="hidden md:inline text-sm">พิมพ์รายงาน</span>
            </button>
          )}

          {user?.role === 'OSM' && (
            <Link href="/person/my-records" className="bg-slate-100 text-slate-700 w-9 h-9 md:w-auto md:h-auto md:px-4 md:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors" title="รายการของฉัน">
              <List className="w-5 h-5 md:w-4 md:h-4" /> <span className="hidden md:inline text-sm font-medium">รายการของฉัน</span>
            </Link>
          )}

          {user ? (
            <button onClick={handleLogout} className="bg-red-50 text-red-600 w-9 h-9 md:w-auto md:h-auto md:px-4 md:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100 transition-colors" title="ออกจากระบบ">
              <LogOut className="w-5 h-5 md:w-4 md:h-4" /> <span className="hidden md:inline text-sm font-medium">ออกจากระบบ</span>
            </button>
          ) : (
            <Link href="/login" className="bg-gradient-to-r from-pink-500 to-sky-500 text-white w-9 h-9 md:w-auto md:h-auto md:px-5 md:py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 shadow-md">
              <LogIn className="w-5 h-5 md:w-4 md:h-4" /> <span className="hidden md:inline text-sm font-medium">เข้าสู่ระบบ</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}