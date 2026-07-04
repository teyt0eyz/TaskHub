import { getDbUser } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

// Room code+ตัวเลข (ตัด 0/O/1/I/L กันสับสน)
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function genCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

// POST /api/invites — Leaders create an invite link for the project
export async function POST(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { project_id, role = "member" } = body || {};
  if (!project_id) return Response.json({ error: "project_id is required" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // ตรวจสอบว่าผู้ขอเป็น leader ของโปรเจกต์นี้
  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || membership.role !== "leader") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const origin = new URL(req.url).origin;
  const isShort = (t) => typeof t === "string" && /^[A-HJ-NP-Z2-9]{6}$/.test(t);

  // มี invite เดิมอยู่แล้วไหม
  const { data: existing } = await supabase
    .from("invites")
    .select("id, token")
    .eq("project_id", project_id)
    .eq("role", role)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // ถ้าเดิมเป็นโค้ด 6 หลักอยู่แล้ว → ใช้ซ้ำ
  if (existing && isShort(existing.token)) {
    return Response.json({ token: existing.token, url: `${origin}/invite/${existing.token}` });
  }

  // สร้างโค้ด 6 หลักที่ไม่ซ้ำ (ลองหลายครั้งกันชนกัน)
  let token = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = genCode();
    const { data: dup } = await supabase.from("invites").select("token").eq("token", code).maybeSingle();
    if (!dup) {
      token = code;
      break;
    }
  }
  if (!token) return Response.json({ error: "code_generation_failed" }, { status: 500 });

  if (existing) {
    // เปลี่ยน token เก่า (แบบยาว) ให้เป็นโค้ด 6 หลัก
    const { error } = await supabase.from("invites").update({ token }).eq("id", existing.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("invites").insert({ project_id, token, role, created_by: user.id });
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ token, url: `${origin}/invite/${token}` });
}
