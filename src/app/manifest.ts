import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ระบบข้อมูลกลุ่มเปราะบาง',
    short_name: 'กลุ่มเปราะบาง',
    description: 'ระบบข้อมูลกลุ่มเปราะบาง เทศบาลตำบลท่าวังทอง',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDF2F8', // สีพื้นหลังชมพูอ่อน
    theme_color: '#EC4899',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        // 👇 ตัวนี้สำคัญมากสำหรับ Splash Screen ของ Android 👇
        src: '/icons/icon-512x512.png', 
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable', // บังคับให้ระบบรู้ว่านี่คือ Maskable
      },
      {
        src: '/icons/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}