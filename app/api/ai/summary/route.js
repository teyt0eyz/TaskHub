import { generateWeeklySummary } from "@/lib/gemini";
import {
  getDbUser,
  getMembership,
  can,
  canTargetRole,
  PERM,
  getRecentCheckins,
  getProjectTasks,
  getProjectAiQuota,
  bumpProjectAiCount,
  saveAiSummary,
  listAiSummaries,
  deleteAiSummaryById,
  AI_LIMIT,
} from "@/lib/data";

export const dynamic = "force-dynamic"; // ห้าม cache — โควตาต้องสดเสมอ
const NO_STORE = { "Cache-Control": "no-store" };

// GET /api/ai/summary?projectId=...[&memberId=...] — โควตาที่เหลือ + ประวัติสรุปของสมาชิกคนนั้น
export async function GET(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const memberId = url.searchParams.get("memberId");
  if (!projectId) return Response.json({ remaining: AI_LIMIT, limit: AI_LIMIT }, { headers: NO_STORE });

  const membership = await getMembership(projectId, user.id);
  const q = await getProjectAiQuota(projectId);
  const resp = { remaining: q.remaining, limit: q.limit, resetAt: q.resetAt, canAI: can(membership, PERM.AI) };
  if (memberId) resp.history = await listAiSummaries(projectId, { scope: "member", targetUserId: memberId });
  return Response.json(resp, { headers: NO_STORE });
}

// POST /api/ai/summary — สรุปงานรายคน (ใช้โควตาของโปรเจกต์ หรือ key ของผู้ใช้เอง)
export async function POST(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const { memberName, projectId, userId, apiKey } = body || {};
  const lang = body?.lang === "th" ? "th" : "en";
  if (!memberName || !projectId) return Response.json({ error: "memberName and projectId required" }, { status: 400 });

  // ต้องมีสิทธิ์ "AI summary" ในโปรเจกต์นี้
  const membership = await getMembership(projectId, user.id);
  if (!can(membership, PERM.AI)) return Response.json({ error: "forbidden" }, { status: 403 });

  // สรุปได้เฉพาะตัวเองหรือคนตำแหน่งต่ำกว่า — ห้ามสรุปคนที่ตำแหน่งสูงกว่า
  if (userId) {
    const target = await getMembership(projectId, userId);
    if (!canTargetRole(membership.role, target?.role, userId === user.id)) {
      return Response.json({ error: "rank_forbidden", message: "You can’t summarize someone of a higher rank" }, { status: 403 });
    }
  }

  const ownKey = typeof apiKey === "string" && apiKey.trim() ? apiKey.trim() : null;

  // ถ้าไม่ได้ใช้ key ตัวเอง → เช็คโควตาของโปรเจกต์
  if (!ownKey) {
    const q = await getProjectAiQuota(projectId);
    if (q.remaining <= 0) {
      return Response.json({ error: "quota_exceeded", remaining: 0, limit: q.limit, resetAt: q.resetAt }, { status: 429 });
    }
  }

  let checkins = body.checkins || [];
  let tasks = body.tasks || [];
  let stats = null;
  if (userId) {
    const [c, all] = await Promise.all([getRecentCheckins(projectId, userId), getProjectTasks(projectId, userId)]);
    checkins = c;
    // รวมAll tasksของคนนี้ (รวมที่ยืนยันปิดแล้ว) เพื่อความคืบหน้าที่ถูกต้อง
    const mine = all.filter((t) => (t.assignees || [t.assignee]).some((a) => a?.id === userId));
    tasks = mine.map((t) => ({ title: t.title, status: t.approved ? "done (approved)" : t.status }));
    const done = mine.filter((t) => t.approved || t.status === "done").length;
    stats = { done, total: mine.length };
  }

  let summary;
  try {
    summary = await generateWeeklySummary(memberName, checkins, tasks, ownKey, stats, lang);
  } catch (e) {
    console.error("ai summary failed:", e?.message);
    return Response.json({ error: "ai_summary_failed", detail: e?.message || String(e) }, { status: 500 });
  }

  // เก็บผลสรุปไว้ในระบบ (หัวหน้า/Deputyเห็นร่วมกัน)
  const saved = await saveAiSummary({ projectId, targetUserId: userId || null, scope: "member", summary, generatedBy: user.id });
  const entry = { id: saved?.id, summary, at: saved?.created_at || new Date().toISOString(), by: user.name || null };

  if (ownKey) {
    return Response.json({ summary, entry, unlimited: true, limit: AI_LIMIT });
  }
  const used = await bumpProjectAiCount(projectId);
  return Response.json({ summary, entry, remaining: Math.max(0, AI_LIMIT - used), limit: AI_LIMIT });
}

// DELETE /api/ai/summary  { id, projectId } — ลบสรุปฉบับหนึ่งออกจากประวัติ (ต้องมีสิทธิ์ AI)
export async function DELETE(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { id, projectId } = body || {};
  if (!id || !projectId) return Response.json({ error: "id and projectId required" }, { status: 400 });
  const membership = await getMembership(projectId, user.id);
  if (!can(membership, PERM.AI)) return Response.json({ error: "forbidden" }, { status: 403 });
  await deleteAiSummaryById(id);
  return Response.json({ ok: true });
}
