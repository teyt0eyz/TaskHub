import Avatar from "./Avatar";
import { priorityStyle, statusStyle } from "@/lib/mockData";

function Assignees({ list = [] }) {
  const shown = list.slice(0, 3);
  const extra = list.length - shown.length;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex items-center">
        {shown.map((a, i) => (
          <div key={a?.id || i} style={{ marginLeft: i === 0 ? 0 : -8 }} className="rounded-full ring-2 ring-surface">
            <Avatar person={a} size={24} />
          </div>
        ))}
      </div>
      <span className="truncate text-xs text-ink-2">
        {list.length === 1 ? list[0]?.name : `${list.length} people`}
        {extra > 0 ? "" : ""}
      </span>
    </div>
  );
}

// Reusable task card matching the Workspace design language.
export default function TaskCard({ task, selected = false, onClick, className = "" }) {
  const pri = priorityStyle[task.priority];
  const st = statusStyle[task.status];
  // งานที่ทำเสร็จแล้วแต่หัวหน้ายังไม่ยืนยัน = รอตรวจ (เป็นตัวที่ทำให้ badge เมนูขึ้น)
  const awaiting = task.status === "done" && !task.approved;

  const boxShadow = selected
    ? "0 0 0 3px rgba(255,107,43,0.15), 0 2px 8px rgba(0,0,0,0.07)"
    : awaiting
    ? "0 0 0 2px rgba(46,158,91,0.45), 0 2px 10px rgba(46,158,91,0.12)"
    : "0 2px 8px rgba(0,0,0,0.07)";

  return (
    <div
      onClick={onClick}
      style={{
        boxShadow,
        border: selected ? "2px solid #FF6B2B" : awaiting ? "1px solid rgba(46,158,91,.5)" : "1px solid var(--color-line)",
      }}
      className={`relative rounded-[10px] bg-white p-[14px] transition-shadow ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div
        style={{ background: st.bar }}
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-[10px]"
      />

      {/* แจ้งเตือนคอมเมนต์ใหม่ — มุมขวาบน เด่นชัด */}
      {task.unreadComments > 0 && (
        <span className="absolute -right-2 -top-2 z-10 inline-flex animate-bounce items-center gap-1 rounded-full bg-[#2c5b9e] px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_3px_10px_rgba(44,91,158,.5)] ring-2 ring-surface">
          💬 {task.unreadComments} new
        </span>
      )}

      {(awaiting || task.needs_revision) && (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {awaiting && (
            <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
              🔔 Awaiting leader approval
            </span>
          )}
          {task.needs_revision && (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-semibold text-danger">
              ↩ Send back for changes
            </span>
          )}
        </div>
      )}

      <div className="pr-2 text-sm font-medium leading-tight text-ink">
        {task.title}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {task.tags.map((tag, i) => (
          <span
            key={tag}
            style={
              i === 0
                ? { color: "var(--color-brand-text)", background: "var(--color-brand-soft)" }
                : { color: "var(--color-ink-2)", background: "var(--color-surface-2)" }
            }
            className="rounded-full px-2.5 py-[3px] text-[11px]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: task.overdue ? "var(--color-accent)" : "var(--color-ink-2)", fontWeight: task.overdue ? 600 : 400 }}
        >
          <span>🗓</span>
          <span>
            {task.deadline}
            {task.overdue ? " ⚠" : ""}
          </span>
        </div>
        <span
          style={{ color: pri.color, background: pri.bg }}
          className="rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
        >
          {pri.label}
        </span>
      </div>

      <div className="my-2.5 h-px bg-line-soft" />

      <div className="flex items-center justify-between">
        <Assignees list={task.assignees?.length ? task.assignees : [task.assignee]} />
        <span
          style={{ color: st.color, background: st.bg }}
          className="rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
        >
          {st.label}
        </span>
      </div>
    </div>
  );
}
