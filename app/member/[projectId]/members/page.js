import Avatar from "@/components/ui/Avatar";
import StatusControl from "@/components/StatusControl";
import { getDbUser, getTeamRoster } from "@/lib/data";

const ROLE_META = {
  leader: { label: "หัวหน้า", cls: "text-brand-dark" },
  deputy: { label: "รองหัวหน้า", cls: "text-[#6b3fa0]" },
  member: { label: "สมาชิก", cls: "text-ink-3" },
};
const roleLabel = (m) => m.title || (ROLE_META[m.role] || ROLE_META.member).label;

export default async function MemberTeamPage({ params }) {
  const { projectId } = await params;
  const [user, roster] = await Promise.all([getDbUser(), getTeamRoster(projectId)]);
  const me = roster.find((m) => m.id === user?.id);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">สมาชิกในทีม</h1>
          <p className="mt-0.5 text-sm text-ink-2">รายชื่อเพื่อนร่วมทีมและสถานะปัจจุบัน</p>
        </div>
        {me && <StatusControl projectId={projectId} current={me.status} />}
      </div>

      {roster.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/60 p-10 text-center text-ink-3">
          ยังไม่มีสมาชิกในโปรเจกต์นี้
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_8px_rgba(0,0,0,.05)]">
          {roster.map((m, i) => {
            const meta = ROLE_META[m.role] || ROLE_META.member;
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-line" : ""} ${m.id === user?.id ? "bg-brand-soft/30" : ""}`}
              >
                <Avatar person={m} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{m.name}</span>
                    {m.id === user?.id && <span className="text-[10px] font-semibold text-ink-3">(ฉัน)</span>}
                  </div>
                  <div className={`text-xs font-medium ${meta.cls}`}>{roleLabel(m)}</div>
                </div>
                {m.status && (
                  <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-2">{m.status}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
