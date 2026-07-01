import { GoogleGenerativeAI } from "@google/generative-ai";

// สรุปงานรายสัปดาห์ด้วย Google Gemini
const MODEL = "gemini-2.0-flash";

// สร้าง client แบบ lazy (กัน build พังตอนยังไม่มี env)
let _model = null;
function getModel() {
  if (_model) return _model;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  const genAI = new GoogleGenerativeAI(apiKey);
  _model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: { maxOutputTokens: 1024 },
  });
  return _model;
}

/**
 * สรุปผลงานรายสัปดาห์ของ member 1 คน เป็นภาษาไทย
 * @param {string} memberName
 * @param {Array<{date:string, done_today?:string, blockers?:string, mood?:string}>} checkins
 * @param {Array<{title:string, status:string}>} tasks
 * @returns {Promise<string>}
 */
export async function generateWeeklySummary(memberName, checkins = [], tasks = []) {
  const model = getModel();

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

กรุณาสรุปเป็นภาษาไทย 2 ส่วน:
1. สรุปผลงานสัปดาห์นี้ (3-4 ประโยค)
2. Feedback แนะนำ (2-3 ประโยค)`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
