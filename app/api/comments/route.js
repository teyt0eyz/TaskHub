import { getDbUser } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createNotifications } from "@/lib/notify";

// GET /api/comments?taskId=...  — คอมเมนต์/อัปเดตความคืบหน้าของงาน
export async function GET(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const taskId = new URL(req.url).searchParams.get("taskId");
  if (!taskId) return Response.json({ error: "taskId is required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("comments")
    .select("id, body, created_at, users(name, email)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const comments = (data || []).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author: c.users?.name || c.users?.email || "ผู้ใช้",
  }));
  return Response.json({ comments });
}

// POST /api/comments  { taskId, body }
export async function POST(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { taskId, body: text } = body || {};
  if (!taskId || !text?.trim()) {
    return Response.json({ error: "taskId and body are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("comments")
    .insert({ task_id: taskId, user_id: user.id, body: text.trim() });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // แจ้งทั้งผู้รับผิดชอบงาน "และหัวหน้าโปรเจกต์" (ยกเว้นคนที่คอมเมนต์เอง)
  const { data: task } = await supabase.from("tasks").select("title, project_id").eq("id", taskId).maybeSingle();
  if (task) {
    const [{ data: as }, { data: leaders }] = await Promise.all([
      supabase.from("task_assignees").select("user_id").eq("task_id", taskId),
      supabase.from("project_members").select("user_id").eq("project_id", task.project_id).eq("role", "leader"),
    ]);
    const recipients = new Set([
      ...(as || []).map((r) => r.user_id),
      ...(leaders || []).map((l) => l.user_id),
    ]);
    recipients.delete(user.id);
    await createNotifications(
      [...recipients].map((uid) => ({
        user_id: uid,
        project_id: task.project_id,
        task_id: taskId,
        type: "comment",
        message: `💬 ${user.name || "สมาชิก"} อัปเดตงาน "${task.title}"`,
      }))
    );
  }

  return Response.json({ ok: true });
}
