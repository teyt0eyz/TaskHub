"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TaskCard from "@/components/ui/TaskCard";
import TaskDetail from "@/components/TaskDetail";
import AssigneeSelect from "@/components/AssigneeSelect";

const columns = [
  { key: "todo", title: "Todo", bar: "#C4C4C4" },
  { key: "in_progress", title: "In Progress", bar: "#FF6B2B" },
  { key: "done", title: "Done", bar: "#2E9E5B" },
];

export default function TasksBoard({ projectId, tasks = [], members = [], currentUserId, canEdit = false }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ title: "", priority: "medium", deadline: "", assigned_to: [], tags: "" });

  const query = q.trim().toLowerCase();
  const visibleTasks = query
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(query)) ||
          (t.assignees || []).some((a) => a?.name?.toLowerCase().includes(query))
      )
    : tasks;

  async function createTask(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        title: form.title.trim(),
        priority: form.priority,
        deadline: form.deadline || null,
        assigned_to: form.assigned_to,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      setForm({ title: "", priority: "medium", deadline: "", assigned_to: [], tags: "" });
      router.refresh();
    } else {
      alert("สร้างงานไม่สำเร็จ");
    }
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">งานทั้งหมด</h1>
          <p className="mt-0.5 text-sm text-ink-2">มอบหมายและติดตามสถานะงานของทีม</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 ค้นหางาน / แท็ก / ชื่อคน"
            className="w-52 rounded-[10px] border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-[10px] bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,43,.3)] hover:bg-[#f55e1d]"
          >
            <span className="text-base leading-none">+</span> สร้างงานใหม่
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const items = visibleTasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="flex flex-col rounded-2xl bg-surface-2/60 p-3">
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.bar }} />
                <span className="text-sm font-semibold text-ink">{col.title}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink-2">
                  {items.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {items.map((t) => (
                  <TaskCard key={t.id} task={t} onClick={() => setDetail(t)} />
                ))}
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-line py-8 text-center text-xs text-ink-3">
                    ยังไม่มีงาน
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={createTask}
            className="w-full max-w-md space-y-3 rounded-2xl border border-line bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold text-ink">สร้างงานใหม่</h2>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">ชื่องาน</label>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="เช่น ทำหน้า login"
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-ink-2">ความด่วน (Priority)</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="low">ต่ำ (Low)</option>
                  <option value="medium">ปานกลาง (Medium)</option>
                  <option value="high">สูง (High)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-ink-2">กำหนดส่ง (Deadline)</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">มอบหมายให้ (เลือกได้หลายคน)</label>
              <AssigneeSelect
                members={members}
                value={form.assigned_to}
                onChange={(v) => setForm({ ...form, assigned_to: v })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">แท็ก (ไม่บังคับ)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="คั่นด้วย , เช่น Design, Frontend"
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-[10px] border border-line px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-[#f55e1d] disabled:opacity-60"
              >
                {busy ? "กำลังสร้าง..." : "สร้างงาน"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <TaskDetail
          task={detail}
          projectId={projectId}
          onClose={() => setDetail(null)}
          canComment={(detail.assignees || [detail.assignee]).some((a) => a?.id === currentUserId)}
          canEdit={canEdit}
          members={members}
        />
      )}
    </div>
  );
}
