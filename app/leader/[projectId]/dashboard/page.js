import { getProjectTasks, getProjectMembers } from "@/lib/data";
import { moods } from "@/lib/mockData";

const STATUS = {
  todo: { label: "Todo", color: "#C4C4C4" },
  in_progress: { label: "In Progress", color: "#FF6B2B" },
  done: { label: "Done", color: "#2E9E5B" },
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
      <div className="text-3xl font-bold" style={{ color: accent }}>
        {value}
      </div>
      <div className="mt-0.5 text-sm text-ink-2">{label}</div>
      {sub && <div className="mt-1 text-xs text-ink-3">{sub}</div>}
    </div>
  );
}

function Donut({ segments, total, centerLabel, centerSub }) {
  const r = 52;
  const sw = 18;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative h-[140px] w-[140px]">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <g transform="rotate(-90 70 70)">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#F0F0F0" strokeWidth={sw} />
          {total > 0 &&
            segments.map((s) => {
              const len = (s.value / total) * c;
              const el = (
                <circle
                  key={s.label}
                  cx="70"
                  cy="70"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={sw}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += len;
              return el;
            })}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-ink">{centerLabel}</div>
        <div className="text-[11px] text-ink-3">{centerSub}</div>
      </div>
    </div>
  );
}

export default async function DashboardPage({ params }) {
  const { projectId } = await params;
  const [tasks, members] = await Promise.all([
    getProjectTasks(projectId),
    getProjectMembers(projectId),
  ]);

  const total = tasks.length;
  const counts = { todo: 0, in_progress: 0, done: 0 };
  for (const t of tasks) counts[t.status] = (counts[t.status] || 0) + 1;
  const overdue = tasks.filter((t) => t.overdue).length;
  const donePct = total ? Math.round((counts.done / total) * 100) : 0;

  const segments = [
    { label: "done", value: counts.done, color: STATUS.done.color },
    { label: "in_progress", value: counts.in_progress, color: STATUS.in_progress.color },
    { label: "todo", value: counts.todo, color: STATUS.todo.color },
  ];

  // mood distribution
  const moodCount = {};
  for (const m of members) moodCount[m.mood] = (moodCount[m.mood] || 0) + 1;
  const moodKeys = Object.keys(moods).filter((k) => moodCount[k]);
  const maxMembers = Math.max(1, members.length);

  const maxTasks = Math.max(1, ...members.map((m) => m.tasksTotal));
  const blocked = members.filter((m) => m.blocker);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-ink">Dashboard</h1>
        <p className="mt-0.5 text-sm text-ink-2">Team progress and wellbeing at a glance</p>
      </div>

      {blocked.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[rgba(193,57,43,.25)] bg-[rgba(193,57,43,.06)] px-4 py-3">
          <span className="text-lg leading-none">🚧</span>
          <div className="text-sm text-ink">
            <b>{blocked.map((m) => m.name).join(", ")}</b> {blocked.length === 1 ? "is" : "are"} stuck — consider stepping in to help.
          </div>
        </div>
      )}

      {/* stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="All tasks" value={total} accent="#1C1C1C" />
        <StatCard label="Done" value={counts.done} sub={`${donePct}%`} accent="#2E9E5B" />
        <StatCard label="In progress" value={counts.in_progress} accent="#FF6B2B" />
        <StatCard label="Overdue" value={overdue} accent="#c1392b" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* status donut */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
          <h2 className="mb-4 text-sm font-semibold text-ink">Task status breakdown</h2>
          <div className="flex items-center gap-6">
            <Donut segments={segments} total={total} centerLabel={`${donePct}%`} centerSub="Done" />
            <div className="space-y-2">
              {segments.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-sm" style={{ background: s.color }} />
                  <span className="text-ink-2">{STATUS[s.label].label}</span>
                  <span className="font-semibold text-ink">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* mood today */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
          <h2 className="mb-4 text-sm font-semibold text-ink">Team mood</h2>
          {moodKeys.length === 0 ? (
            <div className="py-8 text-center text-sm text-ink-3">No mood data yet</div>
          ) : (
            <div className="space-y-3">
              {moodKeys.map((k) => {
                const md = moods[k];
                const n = moodCount[k];
                return (
                  <div key={k} className="flex items-center gap-3">
                    <span className="w-20 text-sm" style={{ color: md.color }}>
                      {md.emoji} {md.label}
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full" style={{ width: `${(n / maxMembers) * 100}%`, background: md.color }} />
                    </div>
                    <span className="w-6 text-right text-sm font-semibold text-ink">{n}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* tasks per member */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.04)] lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink">Tasks per member (done / total)</h2>
          {members.length === 0 ? (
            <div className="py-8 text-center text-sm text-ink-3">No members yet</div>
          ) : (
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="w-28 truncate text-sm text-ink-2" title={m.name}>{m.name}</span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    {/* total */}
                    <div className="absolute inset-y-0 left-0 rounded-full bg-[#E4E4E4]" style={{ width: `${(m.tasksTotal / maxTasks) * 100}%` }} />
                    {/* done */}
                    <div className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: `${(m.tasksDone / maxTasks) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right text-sm font-semibold text-ink">
                    {m.tasksDone}/{m.tasksTotal}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
