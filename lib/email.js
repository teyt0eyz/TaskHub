// ส่งอีเมลจริงถึงผู้รับหลายคน (server-only)
// รองรับ 2 แบบ:
//  1) SMTP (แนะนำ — Gmail/Brevo/ฯลฯ) ส่งหาใครก็ได้ ไม่ต้องมีโดเมน  → ตั้ง SMTP_HOST/PORT/USER/PASS
//  2) Resend (HTTP API)                                            → ตั้ง RESEND_API_KEY (โหมดฟรีต้อง verify domain ถึงส่งหาคนอื่นได้)
// ถ้าไม่ได้ตั้งค่าเลย = no-op (แจ้งเตือนเฉพาะในเว็บ)

import nodemailer from "nodemailer";

const FROM = process.env.EMAIL_FROM || process.env.SMTP_USER || "TaskHub <onboarding@resend.dev>";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3001";

let _transport = null;
function getTransport() {
  if (_transport) return _transport;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  _transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user, pass },
  });
  return _transport;
}

function wrap(bodyHtml, ctaHref) {
  return `<!doctype html><html lang="th"><body style="margin:0;background:#f4f4f4;font-family:'Noto Sans Thai',Sarabun,system-ui,Arial,sans-serif">
    <div style="max-width:520px;margin:24px auto;background:#fff;border:1px solid #eee;border-radius:16px;overflow:hidden">
      <div style="background:#2E9E5B;color:#fff;padding:16px 22px;font-size:18px;font-weight:700">🌳 TaskHub</div>
      <div style="padding:22px;color:#1c1c1c;line-height:1.7;font-size:15px">
        ${bodyHtml}
        <div style="margin-top:22px">
          <a href="${ctaHref}" style="display:inline-block;background:#2E9E5B;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600">เปิดงานใน TaskHub →</a>
        </div>
      </div>
      <div style="padding:14px 22px;color:#9a9a9a;font-size:12px;border-top:1px solid #eee">
        คุณได้รับอีเมลนี้เพราะมีความเคลื่อนไหวสำคัญในงานของคุณ
      </div>
    </div>
  </body></html>`;
}

// ดึงเฉพาะที่อยู่อีเมลออกจาก "ชื่อ <email>" (ที่อยู่ผู้ส่งต้องเป็นบัญชีระบบเสมอ)
function addressOf(s) {
  const m = String(s).match(/<([^>]+)>/);
  return m ? m[1] : String(s);
}

// opts: { fromName?  = ชื่อคนที่ทำให้เกิดแจ้งเตือน (แสดงเป็นชื่อผู้ส่ง),
//         replyTo?   = อีเมลจริงของคนนั้น (กดตอบกลับแล้ววิ่งไปหาเขา) }
export async function sendEmail(to, subject, bodyHtml, opts = {}) {
  if (!to) return;
  // ปลายทางของปุ่ม: opts.link เป็น path (เช่น "/member/123") หรือ URL เต็ม — ไม่ส่งมาก็ไปหน้าแรก
  const link = opts.link
    ? opts.link.startsWith("http")
      ? opts.link
      : `${APP_URL}${opts.link.startsWith("/") ? "" : "/"}${opts.link}`
    : APP_URL;
  const html = wrap(bodyHtml, link);
  // เวอร์ชัน plain-text (อีเมลที่มีแต่ HTML มักโดนตีเป็นสแปมง่ายกว่า)
  const text = `${String(bodyHtml).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()}\n\nเปิดงานใน TaskHub: ${link}`;
  const from = opts.fromName ? `"${opts.fromName}" <${addressOf(FROM)}>` : FROM;
  const replyTo = opts.replyTo || undefined;
  // header ที่ช่วยให้ดูเป็นอีเมลถูกกฎหมาย (ลดโอกาสเข้าสแปม)
  const headers = { "List-Unsubscribe": `<mailto:${addressOf(FROM)}?subject=unsubscribe>` };

  // 1) SMTP
  const transport = getTransport();
  if (transport) {
    try {
      await transport.sendMail({ from, to, subject, html, text, replyTo, headers });
    } catch (e) {
      console.error("[email] SMTP failed:", e.message);
    }
    return;
  }

  // 2) Resend (HTTP)
  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, html, text, reply_to: replyTo, headers }),
      });
      if (!res.ok) console.error("[email] Resend failed:", res.status, await res.text().catch(() => ""));
    } catch (e) {
      console.error("[email] Resend error:", e.message);
    }
  }
}
