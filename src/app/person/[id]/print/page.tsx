'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Printer, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { VULN, type VulnType } from '@/lib/constants';
import { getUsers } from '@/lib/auth';
import LoadingScreen from '@/components/ui/LoadingScreen'; // 👈 เพิ่มบรรทัดนี้เข้ามา

export default function PrintPersonPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [registry, setRegistry] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [osmName, setOsmName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: person, error } = await supabase()
        .from('vulnerable_persons')
        .select('*, interventions(*)')
        .eq('id', id)
        .single();

      if (!error && person) {
        setData(person);
        
        const { data: regData } = await supabase()
          .from('registry_persons')
          .select('house_no, village_no, subdistrict, district, province')
          .eq('national_id', person.national_id)
          .single();
        
        if (regData) setRegistry(regData);

        const users = await getUsers(); // 👈 ใช้ await เพราะดึงจาก Supabase แล้ว
        const staff = users.find(u => u.username === person.created_by);
        if (staff) setOsmName(staff.name);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [id]);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      const role = sessionStorage.getItem('staff_role');
      if (role === 'OSM') {
        router.push('/person/my-records');
      } else {
        router.push('/map');
      }
    }
  };

  // 👇 เรียกใช้ LoadingScreen ที่ Import มาแล้ว 👇
  if (isLoading) return <LoadingScreen />;
  
  if (!data) return <div className="min-h-screen flex items-center justify-center text-slate-500">ไม่พบข้อมูล</div>;

  const formatNationalId = (id: string) => {
    if (!id) return '-';
    const cleanId = id.replace(/\D/g, '');
    return cleanId.replace(/^(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})$/, '$1-$2-$3-$4-$5');
  };

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const calcAdl = (scores: any) => {
    if (!scores) return 0;
    return Object.values(scores).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0">
      
      {/* แถบเครื่องมือ */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-between items-center px-4 print:hidden">
        <button onClick={handleBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-xl shadow-sm transition-colors border border-slate-200">
          <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-2.5 rounded-xl shadow-glow font-medium transition-colors">
          <Printer className="w-5 h-5" /> สั่งพิมพ์ / บันทึกเป็น PDF
        </button>
      </div>

      {/* เนื้อหาเอกสาร */}
      <div className="max-w-[210mm] mx-auto bg-white p-10 shadow-lg print:shadow-none print:p-0 print:max-w-none min-h-[297mm]">
        
        <div className="flex items-center gap-4 border-b-2 border-slate-800 pb-4 mb-6">
          <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">เทศบาลตำบลท่าวังทอง</h1>
            <p className="text-slate-600">อำเภอเมืองพะเยา จังหวัดพะเยา</p>
            <h2 className="text-lg font-semibold mt-1 text-pink-600">แบบบันทึกข้อมูลกลุ่มเปราะบาง</h2>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-lg bg-slate-100 p-2 mb-3 border-l-4 border-pink-500">1. ข้อมูลส่วนบุคคล</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><span className="text-slate-500">ชื่อ-นามสกุล:</span> <strong className="text-slate-900">{data.prefix}{data.first_name} {data.last_name}</strong></p>
            <p><span className="text-slate-500">เลขบัตรประชาชน:</span> {formatNationalId(data.national_id)}</p>
            <p><span className="text-slate-500">วันเกิด:</span> {formatThaiDate(data.birth_date)}</p>
            <p><span className="text-slate-500">เบอร์โทร:</span> {data.phone || '-'}</p>
            <p className="col-span-2">
              <span className="text-slate-500">ที่อยู่ตามทะเบียน:</span>{' '}
              {registry ? `บ้านเลขที่ ${registry.house_no || '-'} หมู่ที่ ${registry.village_no || '-'} ต.${registry.subdistrict} อ.${registry.district} จ.${registry.province}` : data.note || '-'}
            </p>
            <p className="col-span-2 mt-2">
              <span className="text-slate-500">ประเภทกลุ่มเปราะบาง:</span>{' '}
              {data.vulnerabilities?.map((v: string) => VULN[v as VulnType]?.label).join(', ')}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-lg bg-slate-100 p-2 mb-3 border-l-4 border-pink-500">2. ข้อมูลตามแบบประเมิน</h3>
          
          {data.elderly_profile && (
            <div className="mb-4 border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-pink-600 mb-2">แบบประเมินผู้สูงอายุ</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p><span className="text-slate-500">น้ำหนัก/ส่วนสูง:</span> {data.elderly_profile.weight || '-'} กก. / {data.elderly_profile.height || '-'} ซม.</p>
                <p><span className="text-slate-500">การมองเห็น/ได้ยิน:</span> {data.elderly_profile.vision || '-'} / {data.elderly_profile.hearing || '-'}</p>
                <p><span className="text-slate-500">โรคประจำตัว:</span> {data.elderly_profile.diseases?.join(', ') || 'ไม่มี'}</p>
                <p><span className="text-slate-500">คะแนน ADL:</span> <strong>{calcAdl(data.elderly_profile.adlScores)} คะแนน</strong></p>
              </div>
            </div>
          )}

          {data.disability_profile && (
            <div className="mb-4 border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-pink-600 mb-2">แบบประเมินผู้พิการ</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p><span className="text-slate-500">ประเภทความพิการ:</span> {data.disability_profile.disabilityType || '-'}</p>
                <p><span className="text-slate-500">ระดับความพิการ:</span> {data.disability_profile.disabilityLevel || '-'}</p>
                <p><span className="text-slate-500">อุปกรณ์ทางการแพทย์:</span> {data.disability_profile.medicalEquipment || '-'}</p>
                <p><span className="text-slate-500">ผู้ดูแลหลัก:</span> {data.disability_profile.hasCaregiver ? `${data.disability_profile.caregiverName} (${data.disability_profile.caregiverRelation})` : 'ไม่มี'}</p>
              </div>
            </div>
          )}

          {data.welfare_profile && (
            <div className="mb-4 border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-pink-600 mb-2">แบบประเมินความยากลำบาก</h4>
              <div className="grid grid-cols-1 gap-y-2 text-sm">
                <p><span className="text-slate-500">สาเหตุความยากลำบาก:</span> {data.welfare_profile.hardshipCauses?.join(', ') || '-'}</p>
                <p><span className="text-slate-500">สิ่งที่ต้องการให้รัฐช่วย:</span> {data.welfare_profile.governmentNeeds?.join(', ') || '-'}</p>
                <p><span className="text-slate-500">สภาพเศรษฐกิจ:</span> รายรับ {data.welfare_profile.incomeSufficiency || '-'}, หนี้สิน {data.welfare_profile.debtStatus || '-'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h3 className="font-bold text-lg bg-slate-100 p-2 mb-3 border-l-4 border-pink-500">3. ประวัติการให้ความช่วยเหลือ</h3>
          {data.interventions && data.interventions.length > 0 ? (
            <table className="w-full text-sm text-left border-collapse border border-slate-300">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-2 px-3 border-b border-slate-300">วันที่</th>
                  <th className="py-2 px-3 border-b border-slate-300">แนวทาง</th>
                  <th className="py-2 px-3 border-b border-slate-300">หน่วยงาน</th>
                </tr>
              </thead>
              <tbody>
                {data.interventions.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="py-2 px-3 border-b border-slate-200">{inv.assistance_date ? new Date(inv.assistance_date).toLocaleDateString('th-TH') : '-'}</td>
                    <td className="py-2 px-3 border-b border-slate-200 font-medium">{inv.solution_type}</td>
                    <td className="py-2 px-3 border-b border-slate-200">{inv.agency || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 italic text-sm p-4 border rounded-lg bg-slate-50">- ยังไม่มีประวัติการช่วยเหลือ -</p>
          )}
        </div>

        <div className="mt-16 flex justify-between px-8">
          <div className="text-center w-64">
            <p className="mb-8 text-sm text-slate-600">ลงชื่อ ....................................................</p>
            <p className="text-sm font-bold text-slate-800">( {osmName || '...................................................'} )</p>
            <p className="text-xs text-slate-500 mt-1">อสม. ผู้ให้ข้อมูล</p>
          </div>

          <div className="text-center w-64">
            <p className="mb-8 text-sm text-slate-600">ลงชื่อ ....................................................</p>
            <p className="text-sm font-bold text-slate-800">( ................................................... )</p>
            <p className="text-xs text-slate-500 mt-1">ผู้ใหญ่บ้าน / ผู้รับรองข้อมูล</p>
          </div>
        </div>

      </div>
    </div>
  );
}