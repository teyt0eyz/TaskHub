import { getDbUser } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

// DELETE /api/members  { project_id, user_id }  — leader เตะสมาชิกออก
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
    return Response.json({ error: "ลบตัวเองไม่ได้" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // ผู้สั่งต้องเป็น leader
  const { data: me } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!me || me.role !== "leader") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  // ห้ามลบ leader คนอื่น
  const { data: target } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", user_id)
    .maybeSingle();
  if (target?.role === "leader") {
    return Response.json({ error: "ลบหัวหน้าไม่ได้" }, { status: 400 });
  }

  await supabase.from("project_members").delete().eq("project_id", project_id).eq("user_id", user_id);
  // ปลดงานที่มอบหมายให้คนนี้ (เหลือไว้แต่ไม่มีผู้รับผิดชอบ)
  await supabase.from("tasks").update({ assigned_to: null }).eq("project_id", project_id).eq("assigned_to", user_id);
  // เคลียร์คำขอเก่า
  await supabase.from("join_requests").delete().eq("project_id", project_id).eq("user_id", user_id);

  return Response.json({ ok: true });
}
