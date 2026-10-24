import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ระบบข้อมูลกลุ่มเปราะบาง',
    short_name: 'กลุ่มเปราะบาง', // 👈 แก้ให้สั้นลง มันจะได้ไม่ขึ้น ...
    description: 'ระบบข้อมูลกลุ่มเปราะบาง เทศบาลตำบลท่าวังทอง',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDF2F8', 
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
        purpose: 'maskable', // 👈 บังคับให้เป็น Maskable Icon
      },
      {
        src: '/icons/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}