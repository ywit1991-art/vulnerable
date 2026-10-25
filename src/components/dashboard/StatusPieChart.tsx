'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion'; // 👈 เพิ่ม motion

export default function StatusPieChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
        <h3 className="font-bold text-slate-800 text-base mb-2">สถานะการติดตามเพื่อแก้ไขปัญหา</h3>
        <div className="flex-1 flex items-center justify-center text-slate-400">ไม่มีข้อมูล</div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  if (total === 0) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
        <h3 className="font-bold text-slate-800 text-base mb-2">สถานะการติดตามเพื่อแก้ไขปัญหา</h3>
        <div className="flex-1 flex items-center justify-center text-slate-400">ไม่มีข้อมูล</div>
      </div>
    );
  }

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-2">
        {payload.map((entry: any, index: number) => {
          const percent = total > 0 ? ((entry.payload.value / total) * 100).toFixed(0) : 0;
          return (
            <li key={`item-${index}`} className="flex items-center gap-1.5 text-sm">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600">{entry.value}:</span>
              <span className="font-bold text-slate-800 ml-0.5">{entry.payload.value} ราย</span>
              <span className="font-bold text-pink-600">({percent}%)</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    // 👇 เปลี่ยนเป็น motion.div และใส่ Hover Effect เหมือนกราฟอื่น 👇
    <motion.div 
      whileHover={{ y: -5, boxShadow: "0px 10px 30px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.3 }}
      className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col overflow-hidden"
    >
      <h3 className="font-bold text-slate-800 text-base mb-2">สถานะการติดตามเพื่อแก้ไขปัญหา</h3>
      
      <div className="w-full h-[240px] md:h-[280px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={70}
              stroke="none"
              isAnimationActive={true} // 👈 เพิ่ม Animation ตอนโหลด
              animationBegin={200}
              animationDuration={1500}
            >
              {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
            </Pie>
            <Legend 
              verticalAlign="bottom" 
              content={renderLegend} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}