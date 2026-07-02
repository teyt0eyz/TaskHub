import Avatar from "@/components/ui/Avatar";
import AiSummaryButton from "@/components/AiSummaryButton";
import TeamSummaryButton from "@/components/TeamSummaryButton";
import InviteButton from "@/components/InviteButton";
import PendingRequests from "@/components/PendingRequests";
import RemoveMemberButton from "@/components/RemoveMemberButton";
import PromoteMemberButton from "@/components/PromoteMemberButton";
import { moods } from "@/lib/mockData";
import { getDbUser, getProjectMembers, getPendingRequests, getMembership, can, PERM, streakBadge } from "@/lib/data";

const baseRole = (role) => (role === "leader" ? "Leader" : role === "deputy" ? "⭐ รองหัวหน้า" : "Member");
const displayRole = (m) => m.title || baseRole(m.role);

function MemberCard({ m, projectId, canManage, canPromote, canAI }) {
  const mood = m.mood ? moods[m.mood] : null;
  const badge = streakBadge(m.streak);
  const pct = m.tasksTotal ? Math.round((m.tasksDone / m.tasksTotal) * 100) : 0;
  return (
    <div className="relative rounded-2xl border border-line bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.05)]">
      {canManage && m.role !== "leader" && <RemoveMemberButton projectId={projectId} userId={m.id} name={m.name} />}

      <div className="flex items-center gap-3 pr-8">
        <Avatar person={m} size={46} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-ink">{m.name}</span>
            {m.blocker && (
              <span className="rounded-full bg-[rgba(193,57,43,.12)] px-2 py-0.5 text-[10px] font-semibold text-[#c1392b]">
                ● ติดปัญหา
              </span>
            )}
          </div>
          <div className={`text-xs ${m.role === "leader" ? "font-semibold text-brand-dark" : m.role === "deputy" ? "font-semibold text-[#6b3fa0]" : "text-ink-3"}`}>
            {displayRole(m)}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-ink-2">
          <span>ความคืบหน้างาน</span>
          <span className="font-semibold text-ink">
            {m.tasksDone}/{m.tasksTotal}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {mood ? (
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
            style={{ color: mood.color, background: mood.bg }}
          >
            {mood.emoji} {mood.label}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-medium text-ink-3">
            😶 ยังไม่เช็คอิน
          </span>
        )}
        <span className="flex items-center gap-1.5 text-xs text-ink-2">
          🔥 streak <b className="text-ink">{m.streak}</b> วัน
          {badge && <span title={badge.label}>{badge.emoji}</span>}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {canAI && <AiSummaryButton projectId={projectId} memberId={m.id} memberName={m.name} />}
        {canPromote && (
          <PromoteMemberButton
            projectId={projectId}
            userId={m.id}
            name={m.name}
            currentRole={m.role}
            currentPermissions={m.permissions}
            currentTitle={m.title || ""}
          />
        )}
      </div>
    </div>
  );
}

export default async function LeaderMembersPage({ params }) {
  const { projectId } = await params;
  const user = await getDbUser();
  const [members, pending, membership] = await Promise.all([
    getProjectMembers(projectId),
    getPendingRequests(projectId),
    getMembership(projectId, user?.id),
  ]);
  const isLeader = membership?.role === "leader";
  const canManage = can(membership, PERM.MEMBERS);
  const canAI = can(membership, PERM.AI);
  const blocked = members.filter((m) => m.blocker);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">สมาชิกทีม</h1>
          <p className="mt-0.5 text-sm text-ink-2">ภาพรวม mood, streak และความคืบหน้าของแต่ละคน</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canAI && <TeamSummaryButton projectId={projectId} />}
          {canManage && <InviteButton projectId={projectId} />}
        </div>
      </div>

      {canManage && <PendingRequests requests={pending} projectId={projectId} />}

      {blocked.length > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[rgba(193,57,43,.25)] bg-[rgba(193,57,43,.06)] px-4 py-3">
          <span className="text-lg">🚧</span>
          <div className="text-sm text-ink">
            <b>{blocked.map((m) => m.name).join(", ")}</b> กำลังติดปัญหา — ควรเข้าไปช่วยเหลือ
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/60 p-10 text-center text-ink-3">
          ยังไม่มีสมาชิกในโปรเจกต์นี้
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <MemberCard key={m.id} m={m} projectId={projectId} canManage={canManage} canPromote={isLeader} canAI={canAI} />
          ))}
        </div>
      )}
    </div>
  );
}
