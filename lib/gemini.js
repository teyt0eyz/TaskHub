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
export async function generateWeeklySummary(memberName, checkins = [], tasks = [], apiKey = null) {
  const model = getModel(apiKey);

  const checkinsText =
    checkins
      .map(
        (c) =>
          `วันที่ ${c.date}: ทำ: ${c.done_today || "-"} | ติด: ${c.blockers || "-"} | mood: ${c.mood || "-"}`
      )
      .join("\n") || "(ไม่มีข้อมูลเช็คอิน)";

  const tasksText =
    tasks.map((t) => `- ${t.title} (${t.status})`).join("\n") || "(ไม่มีงาน)";

  const prompt = `สรุปผลการทำงานของ ${memberName} ในสัปดาห์นี้ และเขียน feedback สั้นๆ สำหรับหัวหน้าทีม

Check-ins รายวัน:
${checkinsText}

Tasks:
${tasksText}

กรุณาสรุปเป็นภาษาไทยในรูปแบบ Markdown:
## สรุปผลงานสัปดาห์นี้
(3-4 ประโยค)

## Feedback แนะนำ
(2-3 ประโยค จะเป็น bullet ก็ได้)`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * สรุปผลงานของสมาชิก "ทั้งทีม" ในครั้งเดียว โดยแยกเป็นหัวข้อตามชื่อแต่ละคน
 * @param {string} projectName
 * @param {Array<{name:string, role?:string, checkins:Array, tasks:Array}>} members
 * @returns {Promise<string>}
 */
export async function generateTeamSummary(projectName, members = [], apiKey = null) {
  const model = getModel(apiKey);

  const blocks = members
    .map((m) => {
      const checkinsText =
        m.checkins
          .map((c) => `  • ${c.date}: ทำ: ${c.done_today || "-"} | ติด: ${c.blockers || "-"} | mood: ${c.mood || "-"}`)
          .join("\n") || "  (ไม่มีข้อมูลเช็คอิน)";
      const tasksText = m.tasks.map((t) => `  - ${t.title} (${t.status})`).join("\n") || "  (ไม่มีงาน)";
      return `### ${m.name}${m.role === "leader" ? " (หัวหน้า)" : ""}\nCheck-ins:\n${checkinsText}\nTasks:\n${tasksText}`;
    })
    .join("\n\n");

  const names = members.map((m) => m.name).join(", ");

  const prompt = `คุณเป็นผู้ช่วยหัวหน้าทีมของโปรเจกต์ "${projectName}"
ด้านล่างคือข้อมูลการทำงานและ mood ของสมาชิกแต่ละคน:

${blocks}

กรุณาสรุปผลงานรายสัปดาห์ของสมาชิก "แต่ละคน" เป็นภาษาไทย ในรูปแบบ Markdown โดยแยกหัวข้อตามชื่อ (${names})
รูปแบบสำหรับแต่ละคน (ขึ้นต้นชื่อด้วย ##):
## [ชื่อ]
- **สรุปผลงาน:** 2-3 ประโยค
- **Mood/ความเสี่ยง:** 1 ประโยค (ถ้าติดปัญหาให้ระบุ)
- **Feedback สำหรับหัวหน้า:** 1-2 ประโยค

ห้ามใช้ตาราง และปิดท้ายด้วยหัวข้อ "## ภาพรวมทีม" สรุป 2-3 ประโยค`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
