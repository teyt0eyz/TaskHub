import { generateTeamSummary } from "@/lib/gemini";
import {
  getDbUser,
  getMembership,
  can,
  PERM,
  getProjectMembers,
  getProjectTasks,
  getProjectById,
  getRecentCheckins,
  getProjectAiQuota,
  bumpProjectAiCount,
  AI_LIMIT,
} from "@/lib/data";

// POST /api/ai/team-summary  { projectId, apiKey? } — สรุปทั้งทีม (ใช้โควตาโปรเจกต์ หรือ key ผู้ใช้เอง)
export async function POST(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { projectId, apiKey } = body || {};
  if (!projectId) return Response.json({ error: "projectId is required" }, { status: 400 });

  // ต้องมีสิทธิ์ "สรุปด้วย AI"
  const membership = await getMembership(projectId, user.id);
  if (!can(membership, PERM.AI)) return Response.json({ error: "forbidden" }, { status: 403 });

  const ownKey = typeof apiKey === "string" && apiKey.trim() ? apiKey.trim() : null;

  if (!ownKey) {
    const q = await getProjectAiQuota(projectId);
    if (q.remaining <= 0) {
      return Response.json({ error: "quota_exceeded", remaining: 0, limit: q.limit, resetAt: q.resetAt }, { status: 429 });
    }
  }

  const [project, members, allTasks] = await Promise.all([
    getProjectById(projectId),
    getProjectMembers(projectId),
    getProjectTasks(projectId),
  ]);
  if (members.length === 0) return Response.json({ error: "no_members" }, { status: 400 });

  const payload = await Promise.all(
    members.map(async (m) => {
      const checkins = await getRecentCheckins(projectId, m.id);
      const tasks = allTasks
        .filter((t) => (t.assignees || [t.assignee]).some((a) => a?.id === m.id))
        .map((t) => ({ title: t.title, status: t.approved ? "done (ยืนยันแล้ว)" : t.status }));
      return { name: m.name, role: m.role, checkins, tasks };
    })
  );

  let summary;
  try {
    summary = await generateTeamSummary(project?.name || "ทีม", payload, ownKey);
  } catch (e) {
    console.error("team summary failed:", e?.message);
    return Response.json({ error: "ai_summary_failed", detail: e?.message || String(e) }, { status: 500 });
  }

  const base = { summary, projectName: project?.name || "ทีม", limit: AI_LIMIT };
  if (ownKey) return Response.json({ ...base, unlimited: true });

  const used = await bumpProjectAiCount(projectId);
  return Response.json({ ...base, remaining: Math.max(0, AI_LIMIT - used) });
}
