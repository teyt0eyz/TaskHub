import Avatar from "@/components/ui/Avatar";
import AiSummaryButton from "@/components/AiSummaryButton";
import TeamSummaryButton from "@/components/TeamSummaryButton";
import InviteButton from "@/components/InviteButton";
import StatusControl from "@/components/StatusControl";
import PendingRequests from "@/components/PendingRequests";
import RemoveMemberButton from "@/components/RemoveMemberButton";
import PromoteMemberButton from "@/components/PromoteMemberButton";
import { moods } from "@/lib/mockData";
import { getDbUser, getProjectMembers, getPendingRequests, getMembership, can, PERM } from "@/lib/data";

const baseRole = (role) => (role === "leader" ? "Leader" : role === "deputy" ? "⭐ Deputy" : "Member");
const displayRole = (m) => m.title || baseRole(m.role);

function MemberCard({ m, projectId, canManage, canPromote, canAI }) {
  const mood = m.mood ? moods[m.mood] : null;
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
              <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-semibold text-danger">
                ● Stuck
              </span>
            )}
          </div>
          <div className={`text-xs ${m.role === "leader" ? "font-semibold text-brand-dark" : m.role === "deputy" ? "font-semibold text-deputy" : "text-ink-3"}`}>
            {displayRole(m)}
          </div>
          {m.status && <div className="mt-0.5 truncate text-xs text-ink-2">{m.status}</div>}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-ink-2">
          <span>Task progress</span>
          <span className="font-semibold text-ink">
            {m.tasksDone}/{m.tasksTotal}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center">
        {mood ? (
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
            style={{ color: mood.color, background: mood.bg }}
          >
            {mood.emoji} {mood.label}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-medium text-ink-3">
            😶 Not checked in
          </span>
        )}
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
  const me = members.find((m) => m.id === user?.id);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Team</h1>
          <p className="mt-0.5 text-sm text-ink-2">Each person’s mood and progress at a glance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {me && <StatusControl projectId={projectId} current={me.status} />}
          {canAI && <TeamSummaryButton projectId={projectId} />}
          {canManage && <InviteButton projectId={projectId} />}
        </div>
      </div>

      {canManage && <PendingRequests requests={pending} projectId={projectId} />}

      {blocked.length > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-danger-line bg-danger-soft px-4 py-3">
          <span className="text-lg">🚧</span>
          <div className="text-sm text-ink">
            <b>{blocked.map((m) => m.name).join(", ")}</b> is stuck — consider stepping in to help
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/60 p-10 text-center text-ink-3">
          No members in this project yet
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
