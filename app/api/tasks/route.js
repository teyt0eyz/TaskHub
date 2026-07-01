import { getDbUser } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createNotifications } from "@/lib/notify";

// POST /api/tasks — สร้างงานใหม่
export async function POST(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { project_id, title, status = "todo", priority = "medium", deadline = null } = body || {};
  if (!project_id || !title) {
    return Response.json({ error: "project_id and title are required" }, { status: 400 });
  }

  // assigned_to รับได้ทั้ง array (หลายคน) หรือค่าเดี่ยว; ว่าง = มอบให้ผู้สร้าง
  const raw = Array.isArray(body.assigned_to)
    ? body.assigned_to
    : body.assigned_to
    ? [body.assigned_to]
    : [];
  const assignees = [...new Set(raw.filter(Boolean))];
  const effective = assignees.length ? assignees : [user.id];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id,
      title,
      status,
      priority,
      deadline: deadline || null,
      assigned_to: effective[0], // เก็บคนแรกไว้ในคอลัมน์เดิม (เผื่อ query เก่า)
      created_by: user.id,
    })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // ผู้รับผิดชอบทั้งหมด
  await supabase.from("task_assignees").insert(effective.map((uid) => ({ task_id: data.id, user_id: uid })));

  // แจ้งเตือนคนที่ถูกมอบหมาย (ยกเว้นคนสร้างเอง)
  await createNotifications(
    effective
      .filter((uid) => uid !== user.id)
      .map((uid) => ({
        user_id: uid,
        project_id,
        task_id: data.id,
        type: "assigned",
        message: `📋 คุณได้รับมอบหมายงาน: ${title}`,
      }))
  );

  // tags: upsert ชื่อ tag แล้วผูกกับ task
  const tags = Array.isArray(body.tags)
    ? body.tags.map((s) => String(s).trim()).filter(Boolean)
    : [];
  if (tags.length) {
    const { data: tagRows } = await supabase
      .from("tags")
      .upsert(tags.map((name) => ({ name })), { onConflict: "name" })
      .select();
    const links = (tagRows || []).map((t) => ({ task_id: data.id, tag_id: t.id }));
    if (links.length) await supabase.from("task_tags").insert(links);
  }

  return Response.json({ task: data });
}

// PATCH /api/tasks — อัปเดตสถานะ / ตีกลับ (needs_revision) หรือ แก้ไขงาน (leader)
export async function PATCH(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { id, status, needs_revision, title, priority, deadline } = body || {};
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // ฟิลด์ที่แก้ได้เฉพาะ leader ของโปรเจกต์ (เนื้อหางาน + การยืนยันปิดงาน)
  const editsContent =
    title !== undefined ||
    priority !== undefined ||
    deadline !== undefined ||
    body.assigned_to !== undefined ||
    body.tags !== undefined ||
    body.approve !== undefined;

  if (editsContent) {
    const { data: t } = await supabase.from("tasks").select("project_id").eq("id", id).maybeSingle();
    if (!t) return Response.json({ error: "not found" }, { status: 404 });
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", t.project_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership || membership.role !== "leader") {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const update = {};
  if (status) update.status = status;
  if (typeof needs_revision === "boolean") update.needs_revision = needs_revision;
  if (typeof title === "string" && title.trim()) update.title = title.trim();
  if (priority) update.priority = priority;
  if (deadline !== undefined) update.deadline = deadline || null;
  if (body.approve === true) update.approved_at = new Date().toISOString();
  if (body.approve === false) update.approved_at = null;

  if (Object.keys(update).length === 0 && !editsContent) {
    return Response.json({ error: "nothing to update" }, { status: 400 });
  }

  let data;
  if (Object.keys(update).length) {
    const res = await supabase.from("tasks").update(update).eq("id", id).select().single();
    if (res.error) return Response.json({ error: res.error.message }, { status: 500 });
    data = res.data;
  } else {
    const res = await supabase.from("tasks").select("*").eq("id", id).single();
    data = res.data;
  }

  // อัปเดตผู้รับผิดชอบ (แทนที่ทั้งชุด) + แจ้งเตือนคนที่เพิ่งถูกมอบหมาย
  if (editsContent && body.assigned_to !== undefined) {
    const raw = Array.isArray(body.assigned_to) ? body.assigned_to : body.assigned_to ? [body.assigned_to] : [];
    const next = [...new Set(raw.filter(Boolean))];
    const effective = next.length ? next : [user.id];

    const { data: prev } = await supabase.from("task_assignees").select("user_id").eq("task_id", id);
    const prevIds = new Set((prev || []).map((r) => r.user_id));

    await supabase.from("task_assignees").delete().eq("task_id", id);
    await supabase.from("task_assignees").insert(effective.map((uid) => ({ task_id: id, user_id: uid })));
    await supabase.from("tasks").update({ assigned_to: effective[0] }).eq("id", id);
    data.assigned_to = effective[0];

    await createNotifications(
      effective
        .filter((uid) => uid !== user.id && !prevIds.has(uid))
        .map((uid) => ({
          user_id: uid,
          project_id: data.project_id,
          task_id: id,
          type: "assigned",
          message: `📋 คุณได้รับมอบหมายงาน: ${data.title}`,
        }))
    );
  }

  // อัปเดตแท็ก (แทนที่ทั้งชุด)
  if (editsContent && body.tags !== undefined) {
    const tags = Array.isArray(body.tags) ? body.tags.map((s) => String(s).trim()).filter(Boolean) : [];
    await supabase.from("task_tags").delete().eq("task_id", id);
    if (tags.length) {
      const { data: tagRows } = await supabase
        .from("tags")
        .upsert(tags.map((name) => ({ name })), { onConflict: "name" })
        .select();
      const links = (tagRows || []).map((t) => ({ task_id: id, tag_id: t.id }));
      if (links.length) await supabase.from("task_tags").insert(links);
    }
  }

  // หัวหน้ายืนยันงานผ่าน → แจ้งผู้รับผิดชอบทุกคน
  if (body.approve === true) {
    const { data: as } = await supabase.from("task_assignees").select("user_id").eq("task_id", id);
    await createNotifications(
      (as || [])
        .filter((r) => r.user_id !== user.id)
        .map((r) => ({
          user_id: r.user_id,
          project_id: data.project_id,
          task_id: id,
          type: "approved",
          message: `🎉 งาน "${data.title}" ผ่านการตรวจแล้ว เยี่ยมมาก!`,
        }))
    );
  }

  // member ทำงานเสร็จ (done) → แจ้งหัวหน้าโปรเจกต์ให้มาตรวจ
  if (status === "done") {
    const { data: leaders } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", data.project_id)
      .eq("role", "leader");
    await createNotifications(
      (leaders || [])
        .filter((l) => l.user_id !== user.id)
        .map((l) => ({
          user_id: l.user_id,
          project_id: data.project_id,
          task_id: id,
          type: "submitted",
          message: `✅ ${user.name || "สมาชิก"} ทำงาน "${data.title}" เสร็จแล้ว รอตรวจ`,
        }))
    );
  }

  // ตีกลับงาน → แจ้งผู้รับผิดชอบทุกคน
  if (needs_revision === true) {
    const { data: as } = await supabase.from("task_assignees").select("user_id").eq("task_id", id);
    await createNotifications(
      (as || [])
        .filter((r) => r.user_id !== user.id)
        .map((r) => ({
          user_id: r.user_id,
          project_id: data.project_id,
          task_id: id,
          type: "rejected",
          message: `↩ งาน "${data.title}" ถูกตีกลับให้แก้ไข`,
        }))
    );
  }

  return Response.json({ task: data });
}

// DELETE /api/tasks — ลบงาน (เฉพาะ leader ของโปรเจกต์นั้น)
export async function DELETE(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { id } = body || {};
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: task } = await supabase.from("tasks").select("project_id").eq("id", id).maybeSingle();
  if (!task) return Response.json({ error: "not found" }, { status: 404 });

  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", task.project_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || membership.role !== "leader") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
