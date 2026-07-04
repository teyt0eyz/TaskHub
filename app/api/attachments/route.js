import { getDbUser } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

const BUCKET = "attachments";

// GET /api/attachments?taskId=...
export async function GET(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const taskId = new URL(req.url).searchParams.get("taskId");
  if (!taskId) return Response.json({ error: "taskId is required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("attachments")
    .select("id, file_url, file_name, file_type, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ attachments: data || [] });
}

// POST /api/attachments  (multipart/form-data: taskId, file)
export async function POST(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let form;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "invalid form" }, { status: 400 });
  }
  const taskId = form.get("taskId");
  const file = form.get("file");
  if (!taskId || !file || typeof file === "string") {
    return Response.json({ error: "taskId and file are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = (file.name || "file").replace(/[^\w.\-]/g, "_");
  const path = `${taskId}/${Date.now()}-${safeName}`;
  const opts = { contentType: file.type || "application/octet-stream", upsert: false };

  const doUpload = () => supabase.storage.from(BUCKET).upload(path, buffer, opts);

  let { error: upErr } = await doUpload();
  // ถ้ายังไม่มี bucket → สร้างแบบ public อัตโนมัติแล้วลองใหม่
  if (upErr && /bucket not found/i.test(upErr.message)) {
    await supabase.storage.createBucket(BUCKET, { public: true });
    ({ error: upErr } = await doUpload());
  }
  if (upErr) {
    return Response.json({ error: "upload_failed: " + upErr.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { error } = await supabase.from("attachments").insert({
    task_id: taskId,
    file_url: pub.publicUrl,
    file_name: file.name || safeName,
    file_type: file.type || "",
    uploaded_by: user.id,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true, url: pub.publicUrl });
}

// DELETE /api/attachments  { id }  — ลบได้โดยผู้อัปโหลดเอง หรือProject leader
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
  const { data: att } = await supabase
    .from("attachments")
    .select("id, file_url, uploaded_by, task_id")
    .eq("id", id)
    .maybeSingle();
  if (!att) return Response.json({ error: "not found" }, { status: 404 });

  // สิทธิ์: เจ้าของไฟล์ หรือ หัวหน้าของโปรเจกต์นั้น
  let allowed = att.uploaded_by === user.id;
  if (!allowed) {
    const { data: task } = await supabase.from("tasks").select("project_id").eq("id", att.task_id).maybeSingle();
    if (task) {
      const { data: membership } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", task.project_id)
        .eq("user_id", user.id)
        .maybeSingle();
      allowed = membership?.role === "leader";
    }
  }
  if (!allowed) return Response.json({ error: "forbidden" }, { status: 403 });

  // Delete fileจริงใน Storage (path = ส่วนหลัง /<bucket>/)
  const marker = `/${BUCKET}/`;
  const idx = att.file_url.indexOf(marker);
  if (idx !== -1) {
    const path = decodeURIComponent(att.file_url.slice(idx + marker.length));
    await supabase.storage.from(BUCKET).remove([path]);
  }

  const { error } = await supabase.from("attachments").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
