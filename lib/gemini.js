import { GoogleGenerativeAI } from "@google/generative-ai";

// สรุปงานด้วย Google Gemini
// หมายเหตุ: gemini-2.0-flash ถูก Google ตัดโควตา free tier (limit 0) จึงใช้ 2.5-flash ที่ยังมีโควตาฟรี
const MODEL = "gemini-2.5-flash";

const GEN_CONFIG = { maxOutputTokens: 2048 };

// client ที่ใช้ key กลาง (lazy, กัน build พังตอนยังไม่มี env)
let _model = null;
function getSharedModel() {
  if (_model) return _model;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  _model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: MODEL, generationConfig: GEN_CONFIG });
  return _model;
}

// ถ้าผู้ใช้ใส่ key ของตัวเองมา ให้ใช้ key นั้น (generate ไม่จำกัดโควตาโปรเจกต์)
function getModel(apiKey) {
  if (apiKey && apiKey.trim()) {
    return new GoogleGenerativeAI(apiKey.trim()).getGenerativeModel({ model: MODEL, generationConfig: GEN_CONFIG });
  }
  return getSharedModel();
}

/**
 * สรุปผลงานรายสัปดาห์ของ member 1 คน เป็นภาษาไทย
 * @param {string} memberName
 * @param {Array<{date:string, done_today?:string, blockers?:string, mood?:string}>} checkins
 * @param {Array<{title:string, status:string}>} tasks
 * @returns {Promise<string>}
 */
export async function generateWeeklySummary(memberName, checkins = [], tasks = [], apiKey = null, stats = null) {
  const model = getModel(apiKey);

  const done = stats?.done ?? tasks.filter((t) => /done|ยืนยัน|เสร็จ/.test(t.status || "")).length;
  const total = stats?.total ?? tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const checkinsText =
    checkins
      .map(
        (c) =>
          `${c.date}: did: ${c.done_today || "-"} | blockers: ${c.blockers || "-"} | mood: ${c.mood || "-"}`
      )
      .join("\n") || "(no check-in data)";

  const tasksText = tasks.map((t) => `- ${t.title} (${t.status})`).join("\n") || "(no tasks)";

  const prompt = `You are an assistant to a team leader. Summarize the work of "${memberName}" — short, concise, readable in 15 seconds — in English.

Actual data:
- Progress: ${done} of ${total} tasks done (${pct}%)
- Check-ins:
${checkinsText}
- Tasks (status in parentheses):
${tasksText}

Reply in Markdown, following this format exactly. Keep it within limits, no tables, no preamble:
**📊 Progress:** ${done}/${total} tasks (${pct}%) — one short overview sentence
**✅ Doing well:**
- (1-2 short points, based on completed work / good mood / real consistency)
**⚠️ To improve:**
- (1-2 short points, based on stalled or blocked tasks, or what the task should be but isn't yet)`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * สรุปผลงานของสมาชิก "ทั้งทีม" ในครั้งเGoodยว โดยแยกเป็นหัวข้อตามชื่อแต่ละคน
 * @param {string} projectName
 * @param {Array<{name:string, role?:string, checkins:Array, tasks:Array}>} members
 * @returns {Promise<string>}
 */
export async function generateTeamSummary(projectName, members = [], apiKey = null) {
  const model = getModel(apiKey);

  const blocks = members
    .map((m) => {
      const done = m.stats?.done ?? m.tasks.filter((t) => /done|ยืนยัน|เสร็จ/.test(t.status || "")).length;
      const total = m.stats?.total ?? m.tasks.length;
      const checkinsText =
        m.checkins
          .map((c) => `  • ${c.date}: did: ${c.done_today || "-"} | blockers: ${c.blockers || "-"} | mood: ${c.mood || "-"}`)
          .join("\n") || "  (no check-in data)";
      const tasksText = m.tasks.map((t) => `  - ${t.title} (${t.status})`).join("\n") || "  (no tasks)";
      return `### ${m.name}${m.role === "leader" ? " (leader)" : ""}\nProgress: ${done}/${total} tasks\nCheck-ins:\n${checkinsText}\nTasks:\n${tasksText}`;
    })
    .join("\n\n");

  const names = members.map((m) => m.name).join(", ");

  const prompt = `You are an assistant to the leader of the project "${projectName}".
Below is each member's work and mood data:

${blocks}

Summarize "each member's" work — short, concise, quick to read — in English (Markdown), one section per name (${names}).
Format per person (start the name with ## ; do not exceed this; no tables):
## [Name]
**📊 Progress:** [done]/[total] tasks — one short summary sentence
**✅ Doing well:** 1 short point (based on real work)
**⚠️ To improve:** 1 short point (based on stalled/blocked tasks, or what the task should be)

End with "## 🧭 Team overview" — a short 2-sentence summary (who needs help).`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
