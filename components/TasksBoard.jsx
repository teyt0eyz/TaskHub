"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TaskCard from "@/components/ui/TaskCard";
import TaskDetail from "@/components/TaskDetail";
import AssigneeSelect from "@/components/AssigneeSelect";

const columns = [
  { key: "todo", title: "Todo", bar: "#C4C4C4" },
  { key: "in_progress", title: "In Progress", bar: "#FF6B2B" },
  { key: "done", title: "Done", bar: "#2E9E5B" },
];

export default function TasksBoard({ projectId, tasks = [], members = [], currentUserId, canEdit = false, canReview = false, isLeaderRole = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);
  const [q, setQ] = useState("");

  // เปิด task detail อัตโนมัติเมื่อมาจากการกดแจ้งเตือน (?task=<id>)
  useEffect(() => {
    const tid = searchParams.get("task");
    if (!tid) return;
    const t = tasks.find((x) => x.id === tid);
    if (t) {
      setDetail(t);
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, tasks, pathname, router]);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", deadline: "", assigned_to: [], tags: "" });

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
        description: form.description,
        priority: form.priority,
        deadline: form.deadline || null,
        assigned_to: form.assigned_to,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      setForm({ title: "", description: "", priority: "medium", deadline: "", assigned_to: [], tags: "" });
      router.refresh();
    } else {
      alert("Failed to create task");
    }
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">All tasks</h1>
          <p className="mt-0.5 text-sm text-ink-2">Assign and track your team’s tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 Search tasks / tags / people"
            className="w-52 rounded-[10px] border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          {canEdit && (
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-[10px] bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,43,.3)] hover:bg-[#f55e1d]"
            >
              <span className="text-base leading-none">+</span> New task
            </button>
          )}
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
                    No tasks yet
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
            <h2 className="text-lg font-bold text-ink">New task</h2>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">Task name</label>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Build the login page"
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Describe the task, what to do, requirements, etc."
                className="w-full resize-none rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-ink-2">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-ink-2">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">Assign to (multiple allowed)</label>
              <AssigneeSelect
                members={members}
                currentUserId={currentUserId}
                value={form.assigned_to}
                onChange={(v) => setForm({ ...form, assigned_to: v })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">Tags (optional)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="Separate with commas, e.g. Design, Frontend"
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-[10px] border border-line px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-[#f55e1d] disabled:opacity-60"
              >
                {busy ? "Creating..." : "Create task"}
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
          canReview={canReview}
          isLeaderRole={isLeaderRole}
          members={members}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
