'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// 👇 ต้องมีคำว่า export default ตรงนี้เสมอ 👇
export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2000);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="absolute inset-0 bg-gradient-soft opacity-50" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-pink-300/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-sky-300/20 blur-[120px] rounded-full" />

      <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white rounded-full shadow-glow p-2 flex items-center justify-center border-4 border-white z-10 animate-bounce">
        <Image
          src="/logo.png"
          alt="เทศบาลตำบลท่าวังทอง"
          width={160}
          height={160}
          className="object-contain drop-shadow-md"
          priority
        />
        <div className="absolute inset-[-15px] rounded-full border-2 border-dashed border-pink-300/50 animate-[spin_8s_linear_infinite]" />
      </div>

      <div className="mt-8 text-center z-10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-sky-500 bg-clip-text text-transparent mb-2">
          ข้อมูลกลุ่มเปราะบาง
        </h1>
        <p className="text-slate-500 font-medium text-sm tracking-widest uppercase">
          เทศบาลตำบลท่าวังทอง
        </p>
        <p className="text-slate-400 text-xs mt-1">
          อำเภอเมืองพะเยา จังหวัดพะเยา
        </p>
      </div>

      <div className="absolute top-12 h-1.5 w-[200px] bg-gradient-brand rounded-full overflow-hidden">
         <div className="w-full h-full bg-white/30 animate-pulse" />
      </div>
    </div>
  );
}