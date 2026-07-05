import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/password";

// POST /api/auth/reset — ตั้งรหัสผ่านใหม่จาก token ในลิงก์อีเมล
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const token = String(body?.token || "").trim();
  const password = String(body?.password || "");

  if (!token) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้อง" }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from("password_resets")
    .select("id, user_id, expires_at, used")
    .eq("token", token)
    .maybeSingle();

  if (!row || row.used)
    return NextResponse.json({ error: "ลิงก์นี้ใช้ไปแล้วหรือไม่ถูกต้อง" }, { status: 400 });
  if (new Date(row.expires_at).getTime() < Date.now())
    return NextResponse.json({ error: "ลิงก์หมดอายุแล้ว กรุณาขอใหม่อีกครั้ง" }, { status: 400 });

  const password_hash = hashPassword(password);
  await supabase.from("users").update({ password_hash }).eq("id", row.user_id);
  await supabase.from("password_resets").update({ used: true }).eq("id", row.id);

  return NextResponse.json({ ok: true });
}
