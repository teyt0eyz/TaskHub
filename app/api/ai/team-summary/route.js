import { generateTeamSummary } from "@/lib/gemini";
import {
  getDbUser,
  getMembership,
  can,
  roleRank,
  PERM,
  getProjectMembers,
  getProjectTasks,
  getProjectById,
  getRecentCheckins,
  getProjectAiQuota,
  bumpProjectAiCount,
  saveAiSummary,
  listAiSummaries,
  AI_LIMIT,
} from "@/lib/data";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

// GET /api/ai/team-summary?projectId=... — ประวัติTeam summaryที่เก็บไว้ (แชร์กันในทีมผู้จัดการ)
export async function GET(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return Response.json({ history: [] }, { headers: NO_STORE });
  const history = await listAiSummaries(projectId, { scope: "team" });
  return Response.json({ history }, { headers: NO_STORE });
}

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

  // ต้องมีสิทธิ์ "AI summary"
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

  // สรุปได้เฉพาะตัวเอง + คนตำแหน่งต่ำกว่า (Deputyจะไม่เห็น/ไม่สรุปหัวหน้า)
  const actorRank = roleRank(membership.role);
  const visible = members.filter((m) => m.id === user.id || roleRank(m.role) < actorRank);
  if (visible.length === 0) return Response.json({ error: "no_members" }, { status: 400 });

  const payload = await Promise.all(
    visible.map(async (m) => {
      const checkins = await getRecentCheckins(projectId, m.id);
      const mine = allTasks.filter((t) => (t.assignees || [t.assignee]).some((a) => a?.id === m.id));
      const tasks = mine.map((t) => ({ title: t.title, status: t.approved ? "done (approved)" : t.status }));
      const done = mine.filter((t) => t.approved || t.status === "done").length;
      return { name: m.name, role: m.role, checkins, tasks, stats: { done, total: mine.length } };
    })
  );

  let summary;
  try {
    summary = await generateTeamSummary(project?.name || "Team", payload, ownKey);
  } catch (e) {
    console.error("team summary failed:", e?.message);
    return Response.json({ error: "ai_summary_failed", detail: e?.message || String(e) }, { status: 500 });
  }

  const saved = await saveAiSummary({ projectId, targetUserId: null, scope: "team", summary, generatedBy: user.id });
  const entry = { id: saved?.id, summary, projectName: project?.name || "Team", at: saved?.created_at || new Date().toISOString(), by: user.name || null };
  const base = { summary, entry, projectName: project?.name || "Team", limit: AI_LIMIT };
  if (ownKey) return Response.json({ ...base, unlimited: true });

  const used = await bumpProjectAiCount(projectId);
  return Response.json({ ...base, remaining: Math.max(0, AI_LIMIT - used) });
}
