import { redirect } from "next/navigation";
import Link from "next/link";
import InviteJoin from "@/components/InviteJoin";
import { getDbUser } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

function Card({ children }) {
  return (
    <div className="dot-grid flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,.06)]">
        {children}
      </div>
    </div>
  );
}

export default async function InvitePage({ params }) {
  const { token } = await params;
  const supabase = getSupabaseAdmin();

  const { data: invite } = await supabase
    .from("invites")
    .select("project_id, role, projects(name, auto_approve)")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return (
      <Card>
        <div className="text-3xl">🔗</div>
        <h1 className="mt-2 text-lg font-bold text-ink">ลิงก์เชิญไม่ถูกต้องหรือหมดอายุ</h1>
      </Card>
    );
  }

  const projectName = invite.projects?.name || "โปรเจกต์";
  const user = await getDbUser();
  if (!user) {
    return <InviteJoin token={token} projectName={projectName} />;
  }

  // เป็นสมาชิกอยู่แล้ว → เข้าโปรเจกต์เลย
  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", invite.project_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (membership) {
    redirect(`/${membership.role === "leader" ? "leader" : "member"}/${invite.project_id}`);
  }

  // โหมด "เข้าได้เลย" — เพิ่มเป็นสมาชิกทันทีไม่ต้องรออนุมัติ
  if (invite.projects?.auto_approve) {
    await supabase
      .from("project_members")
      .upsert(
        { project_id: invite.project_id, user_id: user.id, role: invite.role || "member" },
        { onConflict: "project_id,user_id", ignoreDuplicates: true }
      );
    await supabase.from("join_requests").update({ status: "approved" }).eq("project_id", invite.project_id).eq("user_id", user.id);
    redirect(`/${invite.role === "leader" ? "leader" : "member"}/${invite.project_id}`);
  }

  // ส่งคำขอเข้าร่วม (รอหัวหน้าอนุมัติ) — ตั้งเป็น pending เสมอ (เผื่อเคยถูกปฏิเสธแล้วขอใหม่)
  await supabase
    .from("join_requests")
    .upsert(
      { project_id: invite.project_id, user_id: user.id, role: invite.role, status: "pending" },
      { onConflict: "project_id,user_id" }
    );

  return (
    <Card>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-3xl">
        ⏳
      </div>
      <h1 className="text-lg font-bold text-ink">ส่งคำขอเข้าร่วมแล้ว</h1>
      <p className="mt-1 text-sm text-ink-2">
        รอหัวหน้าโปรเจกต์ <b className="text-ink">{projectName}</b> อนุมัติ
        เมื่อได้รับอนุมัติแล้วโปรเจกต์จะปรากฏในหน้า Member ของคุณ
      </p>
      <Link
        href="/member"
        className="mt-6 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        ไปหน้า Member
      </Link>
    </Card>
  );
}
