import { createClient } from "@supabase/supabase-js";

// คลายแบบ lazy เพื่อไม่ให้ build พังตอน env ยังไม่ครบ
// (createClient จะ throw ทันทีถ้า url/key เป็น undefined)

let _browser = null;
let _admin = null;

// ใช้ฝั่ง client / server ทั่วไป (anon key — ผูกกับ RLS)
export function getSupabase() {
  if (_browser) return _browser;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  _browser = createClient(url, anon);
  return _browser;
}

// ใช้เฉพาะฝั่ง server (service role — ข้าม RLS) ห้าม import ใน client component
export function getSupabaseAdmin() {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}
