import { generateWeeklySummary } from "@/lib/gemini";
import {
  getDbUser,
  getMembership,
  can,
  PERM,
  getRecentCheckins,
  getMyTasks,
  getProjectAiQuota,
  bumpProjectAiCount,
  AI_LIMIT,
} from "@/lib/data";

// GET /api/ai/summary?projectId=... — โควตา AI ที่เหลือของโปรเจกต์
export async function GET(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return Response.json({ remaining: AI_LIMIT, limit: AI_LIMIT });

  const membership = await getMembership(projectId, user.id);
  const q = await getProjectAiQuota(projectId);
  return Response.json({ remaining: q.remaining, limit: q.limit, resetAt: q.resetAt, canAI: can(membership, PERM.AI) });
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
  if (!memberName || !projectId) return Response.json({ error: "memberName and projectId required" }, { status: 400 });

  // ต้องมีสิทธิ์ "สรุปด้วย AI" ในโปรเจกต์นี้
  const membership = await getMembership(projectId, user.id);
  if (!can(membership, PERM.AI)) return Response.json({ error: "forbidden" }, { status: 403 });

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
  if (userId) {
    const [c, t] = await Promise.all([getRecentCheckins(projectId, userId), getMyTasks(projectId, userId)]);
    checkins = c;
    tasks = t.map((x) => ({ title: x.title, status: x.status }));
  }

  let summary;
  try {
    summary = await generateWeeklySummary(memberName, checkins, tasks, ownKey);
  } catch (e) {
    console.error("ai summary failed:", e?.message);
    return Response.json({ error: "ai_summary_failed", detail: e?.message || String(e) }, { status: 500 });
  }

  if (ownKey) {
    return Response.json({ summary, unlimited: true, limit: AI_LIMIT });
  }
  const used = await bumpProjectAiCount(projectId);
  return Response.json({ summary, remaining: Math.max(0, AI_LIMIT - used), limit: AI_LIMIT });
}
