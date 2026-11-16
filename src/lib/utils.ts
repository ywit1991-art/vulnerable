import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// src/lib/urgency.ts

export interface AssessmentData {
  lives_alone?: boolean;
  no_caregiver?: boolean;
  urgent_24h?: boolean;
  dependency_level?: string; // สำหรับ ผู้สูงอายุ/ผู้ป่วย/ผู้พิการ
  child_nutrition?: string;
  child_family?: string;
  women_safety?: string;
  women_pregnancy?: string;
  homeless_health?: string;
  homeless_shelter?: string;
}

export function calculateUrgencyScore(assessment: AssessmentData, vulnerabilities: string[]) {
  let score = 0;

  // 1. ปัจจัยเสี่ยงพื้นฐาน (สำคัญที่สุด)
  if (assessment.lives_alone) score += 30;
  if (assessment.no_caregiver) score += 20;
  if (assessment.urgent_24h) score += 50;

  // 2. คะแนนเฉพาะกลุ่ม
  // กลุ่มเปราะบาง: ผู้สูงอายุ, ผู้ป่วย, ผู้พิการ
  if (vulnerabilities.includes('ELDERLY') || vulnerabilities.includes('PATIENTS') || vulnerabilities.includes('DISABLED')) {
    if (assessment.dependency_level === 'dependent_bedridden') score += 40; // ติดเตียง
    else if (assessment.dependency_level === 'dependent_house') score += 20; // ติดบ้าน
  }

  // กลุ่มเด็กและเยาวชน
  if (vulnerabilities.includes('CHILDREN')) {
    if (assessment.child_nutrition === 'ผอมแห้ง/ขาดสารอาหารรุนแรง') score += 30;
    if (assessment.child_family === 'กำพร้า/ถูกทอดทิ้ง') score += 40;
  }

  // กลุ่มสตรี
  if (vulnerabilities.includes('WOMEN')) {
    if (assessment.women_safety === 'ถูกทำร้าย/รุนแรงในครอบครัว') score += 40;
    if (assessment.women_pregnancy === 'ตั้งครรภ์เสี่ยงสูง/ไม่มีคนดูแล') score += 30;
  }

  // กลุ่มคนเร่ร่อน
  if (vulnerabilities.includes('HOMELESS')) {
    if (assessment.homeless_shelter === 'ไร้ที่อยู่อาศัย/นอนข้างถนน') score += 30;
    if (assessment.homeless_health === 'เจ็บป่วยทางกาย/จิตขั้นรุนแรง') score += 30;
  }

  // 3. แปลงคะแนนเป็นระดับ (Level)
  let level = 'MONITOR'; // 🟡 เฝ้าระวัง
  if (score >= 70) {
    level = 'CRITICAL'; // 🔴 วิกฤต
  } else if (score >= 40) {
    level = 'URGENT'; // 🟠 เร่งด่วน
  }

  return { score, level };
}