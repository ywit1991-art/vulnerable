import { IBM_Plex_Sans_Thai } from 'next/font/google';
import { Toaster } from 'sonner';
import type { Metadata, Viewport } from 'next';
import './globals.css';

const ibmPlex = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-thai',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ข้อมูลกลุ่มเปราะบาง | เทศบาล',
  description: 'ระบบติดตามและให้ความช่วยเหลือกลุ่มเปราะบาง',
};

export const viewport: Viewport = {
  themeColor: '#EC4899',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={ibmPlex.variable} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-icon.png" />
      </head>
      {/* 👇 เพิ่ม style บังคับฟอนต์ตรงนี้เลย เพื่อความชัวร์ 👇 */}
      <body 
        className="font-sans antialiased bg-slate-50 min-h-screen" 
        style={{ fontFamily: 'var(--font-ibm-plex-thai), sans-serif' }}
        suppressHydrationWarning
      >
        {children}
        <Toaster position="top-center" toastOptions={{ className: '!rounded-2xl !shadow-soft !border-white/60' }} />
      </body>
    </html>
  );
}