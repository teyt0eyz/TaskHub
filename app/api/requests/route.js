import { getDbUser } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createNotifications } from "@/lib/notify";

// POST /api/requests  { id, action: "approve" | "reject" }  (เฉพาะ leader)
export async function POST(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { id, action } = body || {};
  if (!id || !["approve", "reject"].includes(action)) {
    return Response.json({ error: "id and valid action are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: reqRow } = await supabase
    .from("join_requests")
    .select("id, project_id, user_id, role, status")
    .eq("id", id)
    .maybeSingle();
  if (!reqRow) return Response.json({ error: "not found" }, { status: 404 });

  // ผู้อนุมัติต้องเป็น leader ของโปรเจกต์นั้น
  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", reqRow.project_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || membership.role !== "leader") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  if (action === "approve") {
    await supabase
      .from("project_members")
      .upsert(
        { project_id: reqRow.project_id, user_id: reqRow.user_id, role: reqRow.role || "member" },
        { onConflict: "project_id,user_id", ignoreDuplicates: true }
      );
    await supabase.from("join_requests").update({ status: "approved" }).eq("id", id);

    const { data: proj } = await supabase.from("projects").select("name").eq("id", reqRow.project_id).maybeSingle();
    await createNotifications([
      {
        user_id: reqRow.user_id,
        project_id: reqRow.project_id,
        type: "approved",
        message: `✅ คำขอเข้าร่วม "${proj?.name || "โปรเจกต์"}" ได้รับอนุมัติแล้ว`,
      },
    ]);
  } else {
    await supabase.from("join_requests").update({ status: "rejected" }).eq("id", id);
  }

  return Response.json({ ok: true });
}
