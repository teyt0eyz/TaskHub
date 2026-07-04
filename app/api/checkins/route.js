import { getDbUser } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createNotifications } from "@/lib/notify";

// POST /api/checkins — Save/อัปเดตเช็คอินของวันนี้ (1 ครั้งต่อ user ต่อ project ต่อวัน)
export async function POST(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { project_id, done_today = "", blockers = "", plan_tomorrow = "", mood } = body || {};
  if (!project_id || !mood) {
    return Response.json({ error: "project_id and mood are required" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const supabase = getSupabaseAdmin();

  // อ่าน mood เดิมของวันนี้ก่อน เพื่อแจ้งเตือน "เฉพาะตอนเพิ่งเปลี่ยนเป็นติดปัญหา" (กันแจ้งซ้ำ)
  const { data: prev } = await supabase
    .from("check_ins")
    .select("mood")
    .eq("user_id", user.id)
    .eq("project_id", project_id)
    .eq("date", today)
    .maybeSingle();

  const { data, error } = await supabase
    .from("check_ins")
    .upsert(
      { user_id: user.id, project_id, date: today, done_today, blockers, plan_tomorrow, mood },
      { onConflict: "user_id,project_id,date" }
    )
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // เพิ่งเลือก mood "ติดปัญหา" → แจ้งเตือนหัวหน้า + รองหัวหน้า (ในเว็บ)
  if (mood === "blocked" && prev?.mood !== "blocked") {
    const { data: mgrs } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", project_id)
      .in("role", ["leader", "deputy"]);
    await createNotifications(
      (mgrs || [])
        .filter((m) => m.user_id !== user.id)
        .map((m) => ({
          user_id: m.user_id,
          project_id,
          type: "blocked",
          message: `🚧 ${user.name || "A member"} is stuck${blockers?.trim() ? `: ${blockers.trim()}` : " — needs help"}`,
        }))
    );
  }

  return Response.json({ checkin: data });
}
