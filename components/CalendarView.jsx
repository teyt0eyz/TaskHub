"use client";

import { useMemo, useState } from "react";
import TaskDetail from "@/components/TaskDetail";
import { statusStyle } from "@/lib/mockData";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_TH = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n) => String(n).padStart(2, "0");
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
// _deadline อาจเป็น "2026-07-05" หรือ ISO — เอาเฉพาะ 10 ตัวแรก
const dlKey = (t) => (t._deadline ? String(t._deadline).slice(0, 10) : null);

function TaskChip({ task, onClick }) {
  const st = statusStyle[task.status] || statusStyle.todo;
  const done = task.status === "done";
  return (
    <button
      onClick={onClick}
      title={task.title}
      className={`flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] leading-tight transition-colors hover:bg-surface-2 ${
        task.overdue ? "bg-danger-soft" : ""
      }`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: task.overdue ? "#c1392b" : st.bar }} />
      <span className={`truncate ${done ? "text-ink-3 line-through" : task.overdue ? "font-semibold text-danger" : "text-ink"}`}>
        {task.title}
      </span>
    </button>
  );
}

export default function CalendarView({ projectId, tasks = [], members = [], currentUserId, canEdit = false, canReview = false }) {
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [detail, setDetail] = useState(null);

  const byDay = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      const k = dlKey(t);
      if (k) (map[k] ||= []).push(t);
    }
    return map;
  }, [tasks]);

  const noDate = useMemo(() => tasks.filter((t) => !dlKey(t)), [tasks]);
  const todayKey = keyOf(today.getFullYear(), today.getMonth(), today.getDate());

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1).getDay(); // 0 = อาทิตย์
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < first; i++) arr.push(null);
    for (let d = 1; d <= days; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  const shift = (delta) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };
  const goToday = () => setCursor({ y: today.getFullYear(), m: today.getMonth() });

  const openDetail = (t) => setDetail(t);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Deadline calendar</h1>
          <p className="mt-0.5 text-sm text-ink-2">See all tasks by deadline</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line text-ink-2 hover:bg-surface-2" title="Previous month">‹</button>
          <div className="min-w-40 text-center text-sm font-semibold text-ink">
            {MONTHS_TH[cursor.m]} {cursor.y + 543}
          </div>
          <button onClick={() => shift(1)} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line text-ink-2 hover:bg-surface-2" title="Next month">›</button>
          <button onClick={goToday} className="rounded-[10px] border border-brand bg-brand-soft px-3 py-2 text-sm font-semibold text-brand-dark hover:bg-brand/15">Today</button>
        </div>
      </div>

      <div className="scroll-soft overflow-x-auto rounded-2xl border border-line bg-white">
        <div className="min-w-[700px]">
        {/* หัวตารางวัน */}
        <div className="grid grid-cols-7 border-b border-line bg-surface-2/50">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`py-2 text-center text-xs font-semibold ${i === 0 || i === 6 ? "text-ink-3" : "text-ink-2"}`}>
              {w}
            </div>
          ))}
        </div>
        {/* ช่องวัน */}
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} className="min-h-28 border-b border-r border-line-soft bg-surface-2/20" />;
            const k = keyOf(cursor.y, cursor.m, d);
            const items = byDay[k] || [];
            const isToday = k === todayKey;
            const dow = i % 7;
            return (
              <div key={i} className={`min-h-28 border-b border-r border-line-soft p-1.5 ${dow === 0 || dow === 6 ? "bg-surface-2/20" : ""}`}>
                <div className="mb-1 flex items-center justify-between px-0.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday ? "bg-brand text-white" : "text-ink-2"
                    }`}
                  >
                    {d}
                  </span>
                  {items.length > 0 && <span className="text-[10px] text-ink-3">{items.length}</span>}
                </div>
                <div className="space-y-0.5">
                  {items.slice(0, 3).map((t) => (
                    <TaskChip key={t.id} task={t} onClick={() => openDetail(t)} />
                  ))}
                  {items.length > 3 && (
                    <div className="px-1.5 text-[10px] font-medium text-ink-3">+{items.length - 3} tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Tasks with no deadline */}
      {noDate.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-sm font-semibold text-ink-2">No deadline ({noDate.length})</div>
          <div className="flex flex-wrap gap-2">
            {noDate.map((t) => (
              <button
                key={t.id}
                onClick={() => openDetail(t)}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink hover:bg-surface-2"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: (statusStyle[t.status] || statusStyle.todo).bar }} />
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-3">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: statusStyle.todo.bar }} /> Todo</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: statusStyle.in_progress.bar }} /> In Progress</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: statusStyle.done.bar }} /> Done</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#c1392b]" /> Overdue</span>
      </div>

      {detail && (
        <TaskDetail
          task={detail}
          projectId={projectId}
          onClose={() => setDetail(null)}
          canComment={(detail.assignees || [detail.assignee]).some((a) => a?.id === currentUserId)}
          canEdit={canEdit}
          canReview={canReview}
          members={members}
        />
      )}
    </div>
  );
}
