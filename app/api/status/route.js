import { getDbUser, getMembership, setMemberStatus } from "@/lib/data";

export const dynamic = "force-dynamic";

// POST /api/status  { projectId, status } — สมาชิกตั้งสถานะของตัวเอง (status ว่าง = ล้าง)
export async function POST(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { projectId, status } = body || {};
  if (!projectId) return Response.json({ error: "projectId required" }, { status: 400 });

  // ต้องเป็นสมาชิกของโปรเจกต์นี้เท่านั้น
  const membership = await getMembership(projectId, user.id);
  if (!membership) return Response.json({ error: "forbidden" }, { status: 403 });

  const saved = await setMemberStatus(projectId, user.id, status);
  return Response.json({ status: saved });
}
