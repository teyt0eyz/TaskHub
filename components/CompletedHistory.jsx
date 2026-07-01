import { priorityStyle } from "@/lib/mockData";

function fmt(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function TaskRow({ t }) {
  const pri = priorityStyle[t.priority] || priorityStyle.medium;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm">✓</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">{t.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-3">
          <span>ผ่านเมื่อ {fmt(t._approvedAt)}</span>
          {t.deadline && t.deadline !== "ไม่กำหนด" && <span>· กำหนดส่ง {t.deadline}</span>}
          {t.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-2">#{tag}</span>
          ))}
        </div>
      </div>
      <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: pri.color, background: pri.bg }}>
        {pri.label}
      </span>
    </div>
  );
}

export default function CompletedHistory({ groups = [], showMemberHeader = true }) {
  const totalTasks = groups.reduce((n, g) => n + g.tasks.length, 0);

  if (totalTasks === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white/60 p-10 text-center text-ink-3">
        ยังไม่มีงานที่ผ่านการยืนยัน — งานจะมาอยู่ที่นี่เมื่อหัวหน้ากด “ยืนยันงานผ่าน”
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.member?.id || g.member?.name || "x"}>
          {showMemberHeader && (
            <div className="mb-2.5 flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold"
                style={{ background: g.member?.bg || "#F0F0F0", color: g.member?.color || "#5A5A5A" }}
              >
                {g.member?.initials || "?"}
              </span>
              <span className="text-base font-semibold text-ink">{g.member?.name || "ไม่ระบุ"}</span>
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-dark">
                {g.tasks.length} งานเสร็จ
              </span>
            </div>
          )}
          <div className="space-y-2">
            {g.tasks.map((t) => (
              <TaskRow key={t.id} t={t} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
