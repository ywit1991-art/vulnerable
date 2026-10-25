'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md overflow-hidden">
      
      {/* 👇 วงกลมพื้นหลังเบลอๆ (Glow Orb) 👇 */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-64 h-64 bg-pink-300 rounded-full blur-[80px] -top-10 -left-10 pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute w-72 h-72 bg-sky-300 rounded-full blur-[90px] -bottom-10 -right-10 pointer-events-none"
      />

      {/* 👇 โลโก้เรืองแสง 👇 */}
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          filter: [
            "drop-shadow(0 0 15px rgba(236,72,153,0.4))", 
            "drop-shadow(0 0 30px rgba(14,165,233,0.6))", 
            "drop-shadow(0 0 15px rgba(236,72,153,0.4))"
          ] 
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-28 h-28 md:w-36 md:h-36 mb-6 z-10"
      >
        <Image 
          src="/logo.png" 
          alt="Loading Logo" 
          fill 
          className="object-contain" 
          priority
        />
      </motion.div>

      {/* 👇 ข้อความกำลังโหลด 👇 */}
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center gap-2 z-10"
      >
        <h2 className="text-lg md:text-xl font-bold text-slate-700 tracking-wide">
          กำลังโหลดข้อมูล...
        </h2>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
              className="w-2 h-2 rounded-full bg-pink-500"
            />
          ))}
        </div>
      </motion.div>

    </div>
  );
}