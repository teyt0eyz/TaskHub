import { getDbUser, getMembership, can, PERM } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createNotifications } from "@/lib/notify";

const VALID_PERMS = [PERM.REVIEW, PERM.TASKS, PERM.MEMBERS, PERM.SETTINGS, PERM.AI];

// DELETE /api/members  { project_id, user_id }  — นำสมาชิกออก (ต้องมีสิทธิ์Manage members)
export async function DELETE(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { project_id, user_id } = body || {};
  if (!project_id || !user_id) {
    return Response.json({ error: "project_id and user_id are required" }, { status: 400 });
  }
  if (user_id === user.id) {
    return Response.json({ error: "You can't remove yourself" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const me = await getMembership(project_id, user.id);
  if (!can(me, PERM.MEMBERS)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  // ห้ามลบหัวหน้า
  const { data: target } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", user_id)
    .maybeSingle();
  if (target?.role === "leader") {
    return Response.json({ error: "You can't remove the leader" }, { status: 400 });
  }

  await supabase.from("project_members").delete().eq("project_id", project_id).eq("user_id", user_id);
  await supabase.from("tasks").update({ assigned_to: null }).eq("project_id", project_id).eq("assigned_to", user_id);
  // ปลดออกจากงานที่มอบหมาย (junction) เฉพาะงานในโปรเจกต์นี้
  const { data: ids } = await supabase.from("tasks").select("id").eq("project_id", project_id);
  const taskIds = (ids || []).map((t) => t.id);
  if (taskIds.length) {
    await supabase.from("task_assignees").delete().eq("user_id", user_id).in("task_id", taskIds);
  }
  await supabase.from("join_requests").delete().eq("project_id", project_id).eq("user_id", user_id);

  return Response.json({ ok: true });
}

// PATCH /api/members  { project_id, user_id, role, permissions } — แต่งตั้งDeputy/ปลด (เฉพาะหัวหน้าจริง)
export async function PATCH(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { project_id, user_id, role, permissions, title } = body || {};
  if (!project_id || !user_id) {
    return Response.json({ error: "project_id and user_id are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // เฉพาะ "หัวหน้าจริง" เท่านั้นที่ตั้งบทบาท/สิทธิ์ได้
  const me = await getMembership(project_id, user.id);
  if (me?.role !== "leader") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: target } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", user_id)
    .maybeSingle();
  if (!target) return Response.json({ error: "not a member" }, { status: 404 });

  const cleanTitle = typeof title === "string" && title.trim() ? title.trim().slice(0, 30) : null;
  const update = { title: cleanTitle };

  // หัวหน้า: แก้ได้เฉพาะชื่อบทบาท (title) ไม่เปลี่ยนPermission level
  if (target.role !== "leader") {
    if (!["member", "deputy"].includes(role)) {
      return Response.json({ error: "role must be member or deputy" }, { status: 400 });
    }
    const perms = role === "deputy" ? [...new Set((permissions || []).filter((p) => VALID_PERMS.includes(p)))] : [];
    // ผู้ช่วยที่ไม่มีสิทธิ์เลย = Regular member
    update.role = role === "deputy" && perms.length > 0 ? "deputy" : "member";
    update.permissions = update.role === "deputy" ? perms : [];
  }

  const { error } = await supabase
    .from("project_members")
    .update(update)
    .eq("project_id", project_id)
    .eq("user_id", user_id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // แจ้งเตือนผู้ถูกเปลี่ยนสิทธิ์ (เฉพาะเมื่อ role เปลี่ยนจริง) — เด้ง realtime ให้เขาสลับ workspace อัตโนมัติด้วย
  if (update.role && update.role !== target.role && user_id !== user.id) {
    const promoted = update.role === "deputy";
    await createNotifications([
      {
        user_id,
        project_id,
        type: promoted ? "role_promoted" : "role_changed",
        message: promoted
          ? "🎉 You’ve been made a deputy — extra management menus have been added to your workspace"
          : "Your role was changed back to member",
      },
    ]);
  }

  return Response.json({ ok: true });
}
