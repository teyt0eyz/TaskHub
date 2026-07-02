import { getSupabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

// แจ้งเตือนทางอีเมลเฉพาะ event ที่ "จำเป็นต่อการทำงานจริง" เท่านั้น (กันอีเมลรก)
// assigned = ได้รับมอบงาน · rejected = งานถูกตีกลับ · submitted = ลูกทีมทำเสร็จรอตรวจ
const EMAIL_TYPES = new Set(["assigned", "rejected", "submitted"]);
const EMAIL_SUBJECT = {
  assigned: "📋 คุณได้รับมอบหมายงานใหม่",
  rejected: "↩ งานของคุณถูกตีกลับให้แก้ไข",
  submitted: "✅ มีงานเสร็จแล้ว รอคุณตรวจ",
};

// สร้างแจ้งเตือนหลายรายการ (server-only)
// rows: [{ user_id, project_id, task_id?, type, message }]
// อีเมลส่งในนาม "TaskHub" (จากบัญชี taskhub.notify@gmail.com) เสมอ — ไม่โชว์ชื่อผู้สั่ง
export async function createNotifications(rows) {
  const list = (rows || []).filter((r) => r && r.user_id && r.message);
  if (!list.length) return;

  const supabase = getSupabaseAdmin();
  try {
    await supabase.from("notifications").insert(list);
  } catch (e) {
    console.error("createNotifications failed:", e.message);
  }

  // ส่งอีเมลเฉพาะ type ที่จำเป็น (best-effort — ไม่บล็อก/ไม่ทำให้ flow ล้ม)
  try {
    const emailRows = list.filter((r) => EMAIL_TYPES.has(r.type));
    if (!emailRows.length) return;

    const ids = [...new Set(emailRows.map((r) => r.user_id))];
    const { data: users } = await supabase.from("users").select("id, email, name").in("id", ids);
    const byId = {};
    for (const u of users || []) byId[u.id] = u;

    await Promise.all(
      emailRows.map((r) => {
        const u = byId[r.user_id];
        if (!u?.email) return null;
        const subject = EMAIL_SUBJECT[r.type] || "แจ้งเตือนจาก TaskHub";
        const body = `<p style="margin:0 0 8px">สวัสดี ${u.name || ""}</p><p style="margin:0;font-size:16px">${r.message}</p>`;
        return sendEmail(u.email, subject, body);
      })
    );
  } catch (e) {
    console.error("notify email failed:", e.message);
  }
}
