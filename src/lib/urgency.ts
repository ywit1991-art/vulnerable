// src/lib/urgency.ts

export function calculateUrgencyScore(
  adlScore: number,
  vulnerabilities: string[],
  needs: string[],
  familyMembers: number
) {
  let score = 0;

  // 1. ปัจจัยพื้นฐาน: อยู่คนเดียว
  if (familyMembers === 1) score += 30;

  // 2. ปัจจัยจากความต้องการความช่วยเหลือ
  if (needs.includes('ต้องการให้เจ้าหน้าที่ลงพื้นที่ด่วน')) score += 50;
  if (needs.includes('รถรับส่งไปโรงพยาบาล')) score += 30;
  if (needs.includes('ยา/อุปกรณ์การแพทย์')) score += 20;

  // 3. ปัจจัยจากกลุ่มเปราะบางและ ADL
  const isVulnerableGroup = vulnerabilities.some(v => ['ELDERLY', 'PATIENTS', 'DISABLED'].includes(v));
  
  if (isVulnerableGroup) {
    if (adlScore >= 0 && adlScore <= 4) {
      score += 50; // วิกฤต: ติดเตียง
    } else if (adlScore >= 5 && adlScore <= 11) {
      score += 30; // เร่งด่วน: ติดบ้าน
    } else {
      score += 10; // เฝ้าระวัง: ช่วยเหลือตัวเองได้
    }
  } else {
    // กลุ่มอื่นๆ ที่ไม่ได้ประเมิน ADL
    if (vulnerabilities.includes('CHILDREN')) score += 20;
    if (vulnerabilities.includes('WOMEN')) score += 20;
    if (vulnerabilities.includes('HOMELESS')) score += 40;
  }

  // 4. จัดระดับความเร่งด่วน
  let level = 'MONITOR'; // 🟡 เฝ้าระวัง
  if (score >= 70) {
    level = 'CRITICAL'; // 🔴 วิกฤต
  } else if (score >= 40) {
    level = 'URGENT'; // 🟠 เร่งด่วน
  }

  return { score, level };
}