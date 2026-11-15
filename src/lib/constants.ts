// lib/constants.ts

export const VULN = {
  CHILDREN: { label: 'เด็กและเยาวชน', color: '#F59E0B', emoji: '👶' },
  WOMEN: { label: 'สตรีและครอบครัว', color: '#EC4899', emoji: '👩' },
  HOMELESS: { label: 'คนเร่ร่อนและขอทาน', color: '#6B7280', emoji: '🚶' },
  DISABLED: { label: 'คนพิการ', color: '#F97316', emoji: '♿' },
  ELDERLY: { label: 'ผู้สูงอายุ', color: '#A855F7', emoji: '👵' },
  PATIENTS: { label: 'ผู้ป่วย (ติดเตียง/ต่อเนื่อง)', color: '#EF4444', emoji: '🛏️' },
} as const;

export type VulnType = keyof typeof VULN;

// พิกัดสำนักงานเทศบาล (ใช้เป็นจุดเริ่มต้นของแผนที่)
export const MUNICIPALITY_OFFICE = { lat: 19.1750, lng: 99.9150 };

// ตัวเลือกความต้องการรับความช่วยเหลือ
export const NEED_OPTIONS = [
  'อาหาร/ของใช้ยังชีพ',
  'ยา/อุปกรณ์การแพทย์',
  'เงินสงเคราะห์/ทุน',
  'ซ่อมแซมที่อยู่อาศัย',
  'รถรับส่งไปโรงพยาบาล',
  'ต้องการให้เจ้าหน้าที่ลงพื้นที่ด่วน'
];