import { Noto_Sans_Thai } from 'next/font/google';
import { Toaster } from 'sonner';
import type { Metadata, Viewport } from 'next';
import './globals.css';

// 👇 ประกาศตัวแปร notoSansThai ตรงนี้ 👇
const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans-thai',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ระบบข้อมูลกลุ่มเปราะบาง | เทศบาล',
  description: 'ระบบติดตามและให้ความช่วยเหลือกลุ่มเปราะบาง',
};

export const viewport: Viewport = {
  themeColor: '#EC4899',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

// ... โค้ด import ด้านบน ...
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={notoSansThai.variable} suppressHydrationWarning>
      <head>
        {/* 👇 บังคับให้ iOS ใช้รูปนี้เป็นไอคอนและ Splash 👇 */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon.png" />
        <link rel="apple-touch-startup-image" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-sans antialiased bg-slate-50 min-h-screen" suppressHydrationWarning>
        {children}
        <Toaster position="top-center" toastOptions={{ className: '!rounded-2xl !shadow-soft !border-white/60' }} />
      </body>
    </html>
  );
}