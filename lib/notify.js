import { getSupabaseAdmin } from "@/lib/supabase";

// สร้างแจ้งเตือนหลายรายการ (server-only)
// rows: [{ user_id, project_id, task_id?, type, message }]
export async function createNotifications(rows) {
  const list = (rows || []).filter((r) => r && r.user_id && r.message);
  if (!list.length) return;
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("notifications").insert(list);
  } catch (e) {
    console.error("createNotifications failed:", e.message);
  }
}
