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

  // ลิงก์ปลายทางของแต่ละแจ้งเตือน — ขึ้นกับว่าผู้ใช้เป็นผู้จัดการหรือสมาชิกในโปรเจกต์นั้น
  const list = items || [];
  const pids = [...new Set(list.map((i) => i.project_id).filter(Boolean))];
  const roleByProject = {};
  if (pids.length) {
    const { data: mm } = await supabase
      .from("project_members")
      .select("project_id, role")
      .eq("user_id", user.id)
      .in("project_id", pids);
    for (const m of mm || []) roleByProject[m.project_id] = m.role;
  }
  const withHref = list.map((i) => {
    const mgmt = ["leader", "deputy"].includes(roleByProject[i.project_id]);
    let href = "/member";
    if (i.project_id) {
      if (i.task_id) href = mgmt ? `/leader/${i.project_id}/tasks?task=${i.task_id}` : `/member/${i.project_id}?task=${i.task_id}`;
      else href = mgmt ? `/leader/${i.project_id}` : `/member/${i.project_id}`;
    }
    return { ...i, href };
  });

  return Response.json({ userId: user.id, unread: count || 0, items: withHref });
}

// PATCH /api/notifications — ทำเครื่องหมายอ่านแล้ว
// ไม่มี body = ทั้งหมด · { taskId } = เฉพาะแจ้งเตือนของงานนั้น (ใช้ตอนเปิดดูงาน)
export async function PATCH(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let taskId = null;
  try {
    const body = await req.json();
    taskId = body?.taskId || null;
  } catch {
    /* ไม่มี body = อ่านทั้งหมด */
  }

  const supabase = getSupabaseAdmin();
  let q = supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  if (taskId) q = q.eq("task_id", taskId);
  await q;
  return Response.json({ ok: true });
}
