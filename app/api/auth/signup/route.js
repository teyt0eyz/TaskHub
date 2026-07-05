import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/password";

// POST /api/auth/signup — สมัครสมาชิกด้วยอีเมล + รหัสผ่าน
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!name) return NextResponse.json({ error: "กรุณากรอกชื่อ" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "อีเมลไม่ถูกต้อง" }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("users")
    .select("id, password_hash")
    .eq("email", email)
    .maybeSingle();

  // มีบัญชีที่ตั้งรหัสผ่านไว้แล้ว → สมัครซ้ำไม่ได้
  if (existing?.password_hash)
    return NextResponse.json({ error: "อีเมลนี้ถูกใช้สมัครแล้ว" }, { status: 409 });

  const password_hash = hashPassword(password);

  try {
    if (existing) {
      // เคยล็อกอินด้วย Google มาก่อน (ยังไม่มีรหัสผ่าน) → ผูกรหัสผ่านเข้าบัญชีเดิม
      await supabase.from("users").update({ password_hash }).eq("id", existing.id);
    } else {
      await supabase.from("users").insert({ email, name, password_hash });
    }
  } catch (e) {
    return NextResponse.json({ error: "สมัครไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
