import { generateWeeklySummary } from "@/lib/gemini";
import { getDbUser, getRecentCheckins, getMyTasks } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

const LIMIT = 5; // สรุป AI ได้ 5 ครั้ง/เดือน/user

// ต้นเดือนปัจจุบัน (UTC) — ใช้เป็นจุด reset โควตา
function periodStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function nextPeriodStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

// โควตาที่ใช้ไปในเดือนนี้ (ถ้าข้ามเดือนแล้วถือว่าเริ่มนับใหม่ = 0)
function usedThisMonth(user) {
  const reset = user?.ai_summary_reset_at ? new Date(user.ai_summary_reset_at) : null;
  if (!reset || reset < periodStart()) return 0;
  return user?.ai_summary_count || 0;
}

// GET /api/ai/summary — เช็คโควตาที่เหลือของผู้ใช้ปัจจุบัน
export async function GET() {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const used = usedThisMonth(user);
  return Response.json({ remaining: Math.max(0, LIMIT - used), limit: LIMIT, resetAt: nextPeriodStart() });
}

// POST /api/ai/summary — สร้างสรุปด้วย Gemini (นับโควตาของ "คนกด")
export async function POST(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const { memberName, projectId, userId } = body || {};
  if (!memberName) return Response.json({ error: "memberName is required" }, { status: 400 });

  const used = usedThisMonth(user);
  if (used >= LIMIT) {
    return Response.json(
      { error: "quota_exceeded", remaining: 0, limit: LIMIT, resetAt: nextPeriodStart() },
      { status: 429 }
    );
  }

  let checkins = body.checkins || [];
  let tasks = body.tasks || [];
  if (projectId && userId) {
    const [c, t] = await Promise.all([getRecentCheckins(projectId, userId), getMyTasks(projectId, userId)]);
    checkins = c;
    tasks = t.map((x) => ({ title: x.title, status: x.status }));
  }

  let summary;
  try {
    summary = await generateWeeklySummary(memberName, checkins, tasks);
  } catch (e) {
    console.error("ai summary failed:", e.message);
    return Response.json({ error: "ai_summary_failed" }, { status: 500 });
  }

  // สำเร็จแล้วค่อยหักโควตา
  const newCount = used + 1;
  await getSupabaseAdmin()
    .from("users")
    .update({ ai_summary_count: newCount, ai_summary_reset_at: periodStart().toISOString() })
    .eq("id", user.id);

  return Response.json({ summary, remaining: Math.max(0, LIMIT - newCount), limit: LIMIT });
}
