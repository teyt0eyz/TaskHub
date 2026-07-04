import { getSupabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

// แจ้งเตือนทางอีเมลเฉพาะ event ที่ "จำเป็นต่อการทำงานจริง" เท่านั้น (กันอีเมลรก)
// assigned = ได้รับมอบงาน · rejected = งานถูกตีกลับ · submitted = ลูกทีมทำเสร็จรอตรวจ
const EMAIL_TYPES = new Set(["assigned", "rejected", "submitted"]);
const EMAIL_SUBJECT = {
  assigned: "📋 You have a new task assignment",
  rejected: "↩ Your task was sent back for changes",
  submitted: "✅ A task is done and waiting for your review",
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
    const { data: users } = await supabase.from("users").select("id, email, name, email_notifications").in("id", ids);
    const byId = {};
    for (const u of users || []) byId[u.id] = u;

    await Promise.all(
      emailRows.map((r) => {
        const u = byId[r.user_id];
        if (!u?.email || u.email_notifications === false) return null; // ปิดรับอีเมล = ข้าม (ยังแจ้งในเว็บ)
        const subject = EMAIL_SUBJECT[r.type] || "Notification from TaskHub";
        const body = `<p style="margin:0 0 8px">Hi ${u.name || ""}</p><p style="margin:0;font-size:16px">${r.message}</p>`;
        // ลิงก์ลึกไปหน้าที่เกี่ยวข้อง: submitted แจ้งหัวหน้า (หน้า leader) · assigned/rejected แจ้งลูกทีม (หน้า member)
        const link = r.project_id
          ? r.type === "submitted"
            ? `/leader/${r.project_id}/tasks`
            : `/member/${r.project_id}`
          : undefined;
        return sendEmail(u.email, subject, body, { link });
      })
    );
  } catch (e) {
    console.error("notify email failed:", e.message);
  }
}
