// src/components/UrgencyAssessment.tsx
'use client';
import { AlertCircle, HeartPulse, Baby, Users, Footprints } from 'lucide-react';
import { type VulnType } from '@/lib/constants';
import { AssessmentData } from '@/lib/urgency';

interface Props {
  selectedVulns: Set<VulnType>;
  assessmentData: AssessmentData;
  onChange: (data: AssessmentData) => void;
}

export default function UrgencyAssessment({ selectedVulns, assessmentData, onChange }: Props) {
  const updateField = (field: keyof AssessmentData, value: any) => {
    onChange({ ...assessmentData, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* ส่วนที่ 1: ปัจจัยเสี่ยงพื้นฐาน */}
      <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4">
        <h3 className="font-bold text-red-700 flex items-center gap-2 mb-3 text-sm">
          <AlertCircle className="w-4 h-4" /> ปัจจัยเสี่ยงพื้นฐาน (ประเมินทุกคน)
        </h3>
        <div className="space-y-2">
          {[
            { id: 'lives_alone', label: 'อาศัยอยู่คนเดียว (ไม่มีญาติ/ผู้ดูแลอยู่ด้วย)' },
            { id: 'no_caregiver', label: 'ไม่มีผู้ดูแลหลัก (ไม่มีใครพาไปหาหมอ/ช่วยเหลือ)' },
            { id: 'urgent_24h', label: 'ต้องการความช่วยเหลือเร่งด่วนภายใน 24 ชั่วโมง' },
          ].map((item) => (
            <label key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer shadow-sm hover:bg-slate-50 transition-colors border border-slate-100">
              <input
                type="checkbox"
                checked={assessmentData[item.id as keyof AssessmentData] as boolean || false}
                onChange={(e) => updateField(item.id as keyof AssessmentData, e.target.checked)}
                className="w-5 h-5 accent-red-500 shrink-0 rounded"
              />
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ส่วนที่ 2: แบบประเมินเฉพาะกลุ่ม */}
      
      {/* 1. ผู้สูงอายุ / ผู้ป่วย / ผู้พิการ */}
      {(selectedVulns.has('ELDERLY') || selectedVulns.has('PATIENTS') || selectedVulns.has('DISABLED')) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 text-sm">
            <HeartPulse className="w-4 h-4 text-orange-500" /> ประเมินการพึ่งพิง (สูงอายุ / ผู้ป่วย / ผู้พิการ)
          </h3>
          <div className="space-y-2">
            {[
              { id: 'dependent_bedridden', label: 'ติดเตียง (ช่วยเหลือตัวเองไม่ได้เลย)' },
              { id: 'dependent_house', label: 'ติดบ้าน (เดินในบ้านได้บ้าง)' },
              { id: 'dependent_normal', label: 'ช่วยเหลือตัวเองได้ปกติ' },
            ].map((item) => (
              <label key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer border border-slate-200 hover:bg-slate-100 transition-colors">
                <input
                  type="radio"
                  name="dependency_level"
                  checked={assessmentData.dependency_level === item.id}
                  onChange={() => updateField('dependency_level', item.id)}
                  className="w-4 h-4 accent-orange-500 shrink-0"
                />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 2. เด็กและเยาวชน */}
      {selectedVulns.has('CHILDREN') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 text-sm">
            <Baby className="w-4 h-4 text-pink-500" /> ประเมินเด็กและเยาวชน
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">ภาวะโภชนาการ</p>
              {['ผอมแห้ง/ขาดสารอาหารรุนแรง', 'น้ำหนักต่ำกว่าเกณฑ์', 'ปกติ'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 mb-2 text-sm cursor-pointer">
                  <input type="radio" name="child_nutrition" checked={assessmentData.child_nutrition === opt} onChange={() => updateField('child_nutrition', opt)} className="w-4 h-4 accent-pink-500" /> {opt}
                </label>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">สภาพครอบครัว</p>
              {['กำพร้า/ถูกทอดทิ้ง', 'พ่อแม่แยกทาง/ยากจนมาก', 'อยู่กับครอบครัวปกติ'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 mb-2 text-sm cursor-pointer">
                  <input type="radio" name="child_family" checked={assessmentData.child_family === opt} onChange={() => updateField('child_family', opt)} className="w-4 h-4 accent-pink-500" /> {opt}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. สตรีและครอบครัว */}
      {selectedVulns.has('WOMEN') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 text-sm">
            <Users className="w-4 h-4 text-purple-500" /> ประเมินสตรีและครอบครัว
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">ความปลอดภัยในชีวิต</p>
              <div className="flex flex-wrap gap-2">
                {['ถูกทำร้าย/รุนแรงในครอบครัว', 'เสี่ยงถูกทำร้าย', 'ปลอดภัย'].map((opt) => (
                  <label key={opt} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border ${assessmentData.women_safety === opt ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <input type="radio" className="hidden" name="women_safety" checked={assessmentData.women_safety === opt} onChange={() => updateField('women_safety', opt)} /> {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">สถานะการตั้งครรภ์</p>
              <div className="flex flex-wrap gap-2">
                {['ตั้งครรภ์เสี่ยงสูง/ไม่มีคนดูแล', 'ตั้งครรภ์ปกติ', 'ไม่ได้ตั้งครรภ์'].map((opt) => (
                  <label key={opt} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border ${assessmentData.women_pregnancy === opt ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <input type="radio" className="hidden" name="women_pregnancy" checked={assessmentData.women_pregnancy === opt} onChange={() => updateField('women_pregnancy', opt)} /> {opt}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. คนเร่ร่อน */}
      {selectedVulns.has('HOMELESS') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 text-sm">
            <Footprints className="w-4 h-4 text-gray-600" /> ประเมินคนเร่ร่อนและขอทาน
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">ประเมินสุขภาพ</p>
              {['เจ็บป่วยทางกาย/จิตขั้นรุนแรง', 'มีโรคประจำตัว', 'แข็งแรงดี'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 mb-2 text-sm cursor-pointer">
                  <input type="radio" name="homeless_health" checked={assessmentData.homeless_health === opt} onChange={() => updateField('homeless_health', opt)} className="w-4 h-4 accent-gray-600" /> {opt}
                </label>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">ประเมินที่พักพิง</p>
              {['ไร้ที่อยู่อาศัย/นอนข้างถนน', 'พักพิงชั่วคราว', 'มีที่ซุกหัวนอน'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 mb-2 text-sm cursor-pointer">
                  <input type="radio" name="homeless_shelter" checked={assessmentData.homeless_shelter === opt} onChange={() => updateField('homeless_shelter', opt)} className="w-4 h-4 accent-gray-600" /> {opt}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}