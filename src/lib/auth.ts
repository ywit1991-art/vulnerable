import { supabase } from '@/lib/supabase/client';

export type Role = 'SUPERADMIN' | 'MUNICIPALITY' | 'OSM';

export interface AppUser {
  id?: string;
  username: string;
  password?: string;
  role: Role;
  name: string;
  area?: string;
}

// ดึงข้อมูลจาก Supabase
export const getUsers = async (): Promise<AppUser[]> => {
  const { data, error } = await supabase().from('app_users').select('*').order('role');
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return data || [];
};

// บันทึก/อัปเดต ข้อมูล
export const saveUser = async (user: AppUser) => {
  if (user.id) {
    // ถ้ามี id แปลว่าเป็นการแก้ไข
    const { error } = await supabase().from('app_users').update({
      name: user.name,
      password: user.password,
      role: user.role,
      area: user.area || null,
    }).eq('id', user.id);
    if (error) throw error;
  } else {
    // ถ้าไม่มี id แปลว่าเพิ่มใหม่
    const { error } = await supabase().from('app_users').insert([{
      username: user.username,
      password: user.password,
      role: user.role,
      name: user.name,
      area: user.area || null,
    }]);
    if (error) throw error;
  }
};

// ลบข้อมูล
export const deleteUser = async (id: string) => {
  const { error } = await supabase().from('app_users').delete().eq('id', id);
  if (error) throw error;
};

// ฟังก์ชันเช็ก Auth (ใช้ SessionStorage เหมือนเดิม)
export const checkAuth = (allowedRoles: Role[]) => {
  if (typeof window === 'undefined') return null;
  const role = sessionStorage.getItem('staff_role') as Role;
  const name = sessionStorage.getItem('staff_name');
  const username = sessionStorage.getItem('staff_code');
  const area = sessionStorage.getItem('staff_area');
  
  if (!role || !allowedRoles.includes(role)) return null;
  return { role, name, username, area };
};