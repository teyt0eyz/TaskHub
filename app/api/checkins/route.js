import { getDbUser } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

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
  const { data, error } = await supabase
    .from("check_ins")
    .upsert(
      { user_id: user.id, project_id, date: today, done_today, blockers, plan_tomorrow, mood },
      { onConflict: "user_id,project_id,date" }
    )
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ checkin: data });
}
