'use client';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { motion } from 'framer-motion';
import { Building2, Users } from 'lucide-react';

export default function HouseholdBarChart({ data }: { data: any[] }) {
  const [viewMode, setViewMode] = useState<'households' | 'members'>('households');

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
        <h3 className="font-bold text-slate-800 text-lg mb-4">จำนวนครัวเรือนเปราะบาง</h3>
        <div className="flex-1 flex items-center justify-center text-slate-400">ไม่มีข้อมูล</div>
      </div>
    );
  }

  return (
    <motion.div 
      whileHover={{ y: -5, boxShadow: "0px 10px 30px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.3 }}
      className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h3 className="font-bold text-slate-800 text-base md:text-lg">
          {viewMode === 'households' ? 'จำนวนครัวเรือนเปราะบาง' : 'จำนวนสมาชิกกลุ่มเปราะบาง'}
        </h3>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('households')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'households' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Building2 className="w-3.5 h-3.5" /> ครัวเรือน
          </button>
          <button 
            onClick={() => setViewMode('members')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'members' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users className="w-3.5 h-3.5" /> สมาชิก
          </button>
        </div>
      </div>

      <div className="flex-1" suppressHydrationWarning>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `หมู่ ${value}`} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
            
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            
            {viewMode === 'households' ? (
              <Bar dataKey="households" name="จำนวนครัวเรือน" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={30} isAnimationActive={true} animationDuration={1000}>
                {/* 👇 แก้ไข formatter ให้ใช้ any และแปลงเป็น String 👇 */}
                <LabelList dataKey="households" position="top" fill="#EC4899" fontSize={13} fontWeight="bold" formatter={(val: any) => Number(val) > 0 ? String(val) : ''} />
              </Bar>
            ) : (
              <>
                <Bar dataKey="ELDERLY" name="ผู้สูงอายุ" stackId="a" fill="#A855F7" barSize={20} isAnimationActive={true} animationBegin={0} animationDuration={1000}>
                  <LabelList dataKey="ELDERLY" position="center" fill="#fff" fontSize={11} fontWeight="bold" formatter={(val: any) => Number(val) > 0 ? String(val) : ''} />
                </Bar>
                <Bar dataKey="DISABLED" name="ผู้พิการ" stackId="a" fill="#F97316" barSize={20} isAnimationActive={true} animationBegin={200} animationDuration={1000}>
                  <LabelList dataKey="DISABLED" position="center" fill="#fff" fontSize={11} fontWeight="bold" formatter={(val: any) => Number(val) > 0 ? String(val) : ''} />
                </Bar>
                <Bar dataKey="BEDRIDDEN" name="ผู้ป่วยติดเตียง" stackId="a" fill="#EF4444" barSize={20} isAnimationActive={true} animationBegin={400} animationDuration={1000}>
                  <LabelList dataKey="BEDRIDDEN" position="center" fill="#fff" fontSize={11} fontWeight="bold" formatter={(val: any) => Number(val) > 0 ? String(val) : ''} />
                </Bar>
                <Bar dataKey="LOW_INCOME" name="รายได้น้อย" stackId="a" fill="#F59E0B" barSize={20} isAnimationActive={true} animationBegin={600} animationDuration={1000}>
                  <LabelList dataKey="LOW_INCOME" position="center" fill="#fff" fontSize={11} fontWeight="bold" formatter={(val: any) => Number(val) > 0 ? String(val) : ''} />
                </Bar>
                <Bar dataKey="PREGNANT" name="ตั้งครรภ์" stackId="a" fill="#3B82F6" barSize={20} radius={[4, 4, 0, 0]} isAnimationActive={true} animationBegin={800} animationDuration={1000}>
                  <LabelList dataKey="PREGNANT" position="center" fill="#fff" fontSize={11} fontWeight="bold" formatter={(val: any) => Number(val) > 0 ? String(val) : ''} />
                </Bar>
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}