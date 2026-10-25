'use client';
import dynamic from 'next/dynamic';
import LoadingScreen from '@/components/ui/LoadingScreen'; // 👈 Import LoadingScreen

const AdminContent = dynamic(() => import('./AdminContent'), { 
  ssr: false,
  loading: () => <LoadingScreen /> // 👈 ใช้ LoadingScreen ตอนรอโหลด
});

export default function AdminPage() {
  return <AdminContent />;
}