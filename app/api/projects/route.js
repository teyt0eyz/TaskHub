import { getDbUser, getMembership, can, PERM } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

// POST /api/projects — สร้างโปรเจกต์ใหม่ (ผู้สร้างกลายเป็น leader)
export async function POST(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { name, description = "", color = "#2E9E5B" } = body || {};
  if (!name) return Response.json({ error: "name is required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name, description, color, owner_id: user.id })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await supabase
    .from("project_members")
    .insert({ project_id: project.id, user_id: user.id, role: "leader" });

  return Response.json({ project });
}

// PATCH /api/projects — เปลี่ยนชื่อโปรเจกต์ (เฉพาะ leader)
export async function PATCH(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { id, name, member_visibility, auto_approve } = body || {};
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const update = {};
  if (typeof name === "string" && name.trim()) update.name = name.trim();
  if (member_visibility === "own" || member_visibility === "all") update.member_visibility = member_visibility;
  if (typeof auto_approve === "boolean") update.auto_approve = auto_approve;
  if (Object.keys(update).length === 0) {
    return Response.json({ error: "nothing to update" }, { status: 400 });
  }

  const m = await getMembership(id, user.id);
  if (!can(m, PERM.SETTINGS)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("projects").update(update).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ project: data });
}

// DELETE /api/projects  { id } — ลบโปรเจกต์ทั้งหมด (เฉพาะหัวหน้าจริงเท่านั้น)
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

  const m = await getMembership(id, user.id);
  if (m?.role !== "leader") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  // ลบ project → cascade ลบ tasks/สมาชิก/คอมเมนต์/แจ้งเตือน ฯลฯ ตาม on delete cascade
  const { error } = await getSupabaseAdmin().from("projects").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
