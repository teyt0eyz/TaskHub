import { getDbUser } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET /api/notifications — รายการแจ้งเตือนของฉัน + จำนวนที่ยังไม่อ่าน
export async function GET() {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const [{ data: items }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, message, type, read, created_at, project_id, task_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false),
  ]);

  return Response.json({ userId: user.id, unread: count || 0, items: items || [] });
}

// PATCH /api/notifications — ทำเครื่องหมายอ่านแล้ว (ทั้งหมด)
export async function PATCH() {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  return Response.json({ ok: true });
}
