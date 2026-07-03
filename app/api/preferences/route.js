import { getDbUser, setEmailNotifications } from "@/lib/data";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

// GET /api/preferences — ค่าตั้งค่าปัจจุบันของผู้ใช้
export async function GET() {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  // ค่าเริ่มต้นเปิด (true) ถ้ายังไม่เคยตั้ง
  return Response.json({ emailNotifications: user.email_notifications !== false }, { headers: NO_STORE });
}

// POST /api/preferences  { emailNotifications: boolean }
export async function POST(req) {
  const user = await getDbUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const saved = await setEmailNotifications(user.id, body.emailNotifications !== false && !!body.emailNotifications);
  return Response.json({ emailNotifications: saved }, { headers: NO_STORE });
}
