import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { randomToken } from "@/lib/password";
import { sendEmail } from "@/lib/email";

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3001";

// POST /api/auth/forgot — ขอลิงก์รีเซ็ตรหัสผ่านทางอีเมล
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const email = String(body?.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from("users")
    .select("id, name, password_hash")
    .eq("email", email)
    .maybeSingle();

  // ตอบ ok เสมอ (ไม่บอกว่าอีเมลมีจริงไหม เพื่อความปลอดภัย)
  const resp = { ok: true };

  // ส่งลิงก์เฉพาะบัญชีที่ตั้งรหัสผ่านไว้ (บัญชี Google ล้วน ๆ ไม่มีรหัสให้รีเซ็ต)
  if (user?.password_hash) {
    const token = randomToken();
    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 ชม.
    await supabase.from("password_resets").insert({ user_id: user.id, token, expires_at });

    const link = `${APP_URL}/reset-password?token=${token}`;
    await sendEmail(
      email,
      "รีเซ็ตรหัสผ่าน TaskHub",
      `<p>สวัสดี ${user.name || ""}</p>
       <p>เราได้รับคำขอรีเซ็ตรหัสผ่านของคุณ กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์หมดอายุใน 1 ชั่วโมง)</p>
       <p>ถ้าคุณไม่ได้เป็นคนขอ ให้ละเว้นอีเมลนี้ได้เลย</p>`,
      { link }
    );

    // dev: ถ้ายังไม่ได้ตั้ง SMTP/Resend จะส่งอีเมลจริงไม่ได้ — คืนลิงก์มาให้ทดสอบ
    if (process.env.NODE_ENV !== "production") resp.devLink = link;
  }

  return NextResponse.json(resp);
}
