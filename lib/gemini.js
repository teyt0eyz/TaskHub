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
          `วันที่ ${c.date}: ทำ: ${c.done_today || "-"} | ติด: ${c.blockers || "-"} | mood: ${c.mood || "-"}`
      )
      .join("\n") || "(ไม่มีข้อมูลเช็คอิน)";

  const tasksText = tasks.map((t) => `- ${t.title} (${t.status})`).join("\n") || "(ไม่มีงาน)";

  const prompt = `คุณเป็นผู้ช่วยหัวหน้าทีม สรุปผลงานของ "${memberName}" แบบ "สั้น กระชับ อ่านจบใน 15 วินาที" เป็นภาษาไทย

ข้อมูลจริง:
- ความคืบหน้า: ทำเสร็จ ${done} จาก ${total} งาน (${pct}%)
- Check-ins:
${checkinsText}
- Tasks (สถานะในวงเล็บ):
${tasksText}

ตอบเป็น Markdown ตามรูปแบบนี้เป๊ะๆ ห้ามเกินที่กำหนด ห้ามใช้ตาราง ห้ามเกริ่นนำ:
**📊 ความคืบหน้า:** ${done}/${total} งาน (${pct}%) — สรุปภาพรวม 1 ประโยคสั้น
**✅ ทำได้ดี:**
- (1-2 ข้อ สั้นๆ อิงจากงานที่เสร็จ/mood ดี/ความสม่ำเสมอจริง)
**⚠️ ควรปรับปรุง:**
- (1-2 ข้อ สั้นๆ อิงจากงานที่ยังค้าง/ติดปัญหา/สิ่งที่งานนั้นควรจะเป็นแต่ยังไม่ถึง)`;

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
      const done = m.stats?.done ?? m.tasks.filter((t) => /done|ยืนยัน|เสร็จ/.test(t.status || "")).length;
      const total = m.stats?.total ?? m.tasks.length;
      const checkinsText =
        m.checkins
          .map((c) => `  • ${c.date}: ทำ: ${c.done_today || "-"} | ติด: ${c.blockers || "-"} | mood: ${c.mood || "-"}`)
          .join("\n") || "  (ไม่มีข้อมูลเช็คอิน)";
      const tasksText = m.tasks.map((t) => `  - ${t.title} (${t.status})`).join("\n") || "  (ไม่มีงาน)";
      return `### ${m.name}${m.role === "leader" ? " (หัวหน้า)" : ""}\nความคืบหน้า: ${done}/${total} งาน\nCheck-ins:\n${checkinsText}\nTasks:\n${tasksText}`;
    })
    .join("\n\n");

  const names = members.map((m) => m.name).join(", ");

  const prompt = `คุณเป็นผู้ช่วยหัวหน้าทีมของโปรเจกต์ "${projectName}"
ด้านล่างคือข้อมูลงานและ mood ของสมาชิกแต่ละคน:

${blocks}

สรุปผลงานของสมาชิก "แต่ละคน" แบบสั้น กระชับ อ่านเร็ว เป็นภาษาไทย (Markdown) แยกหัวข้อตามชื่อ (${names})
รูปแบบสำหรับแต่ละคน (ขึ้นต้นชื่อด้วย ## และห้ามยาวเกินนี้ ห้ามใช้ตาราง):
## [ชื่อ]
**📊 ความคืบหน้า:** [เสร็จ]/[ทั้งหมด] งาน — สรุป 1 ประโยคสั้น
**✅ ทำได้ดี:** 1 ข้อสั้นๆ (อิงงานจริง)
**⚠️ ควรปรับปรุง:** 1 ข้อสั้นๆ (อิงงานที่ค้าง/ติดปัญหา หรือสิ่งที่งานควรจะเป็น)

ปิดท้ายด้วย "## 🧭 ภาพรวมทีม" สรุปสั้นๆ 2 ประโยค (ใครควรได้รับความช่วยเหลือ)`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
