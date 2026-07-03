"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { priorityStyle } from "@/lib/mockData";
import AssigneeSelect from "@/components/AssigneeSelect";

const STATUSES = [
  { key: "todo", label: "Todo", bg: "#F0F0F0", color: "#5A5A5A" },
  { key: "in_progress", label: "In Progress", bg: "rgba(255,107,43,.12)", color: "#FF6B2B" },
  { key: "done", label: "Done", bg: "#2E9E5B", color: "#fff" },
];

export default function TaskDetail({ task, projectId, onClose, canComment = true, canEdit = false, canReview = false, members = [], currentUserId = null }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [status, setStatus] = useState(task.status);
  const [needsRev, setNeedsRev] = useState(!!task.needs_revision);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectText, setRejectText] = useState("");
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority || "medium",
    deadline: task._deadline || "",
    assigned_to: (task.assignees || [task.assignee]).map((a) => a?.id).filter(Boolean),
    tags: (task.tags || []).join(", "),
  });

  async function loadComments() {
    const res = await fetch(`/api/comments?taskId=${task.id}`);
    if (res.ok) setComments((await res.json()).comments || []);
  }
  async function loadAttachments() {
    const res = await fetch(`/api/attachments?taskId=${task.id}`);
    if (res.ok) setAttachments((await res.json()).attachments || []);
  }
  useEffect(() => {
    loadComments();
    loadAttachments();
    // เปิดดูงานนี้ = อ่านคอมเมนต์ใหม่แล้ว → ทำเครื่องหมายอ่าน + เคลียร์ badge บนการ์ด
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id }),
    })
      .then(() => router.refresh())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  // member เปลี่ยนสถานะเอง (และเคลียร์สถานะตีกลับเมื่อลงมือทำต่อ)
  async function changeStatus(s) {
    setStatus(s);
    setNeedsRev(false);
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status: s, needs_revision: false }),
    });
    router.refresh();
  }

  async function addComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setBusy(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, body: newComment }),
    });
    setBusy(false);
    if (res.ok) {
      setNewComment("");
      loadComments();
      setSent(true);
      setTimeout(() => setSent(false), 2500);
      router.refresh();
    } else {
      alert("ส่งไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  }

  async function deleteAttachment(id) {
    if (!confirm("ลบไฟล์นี้?")) return;
    const res = await fetch("/api/attachments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) loadAttachments();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error === "forbidden" ? "ลบได้เฉพาะเจ้าของไฟล์หรือหัวหน้าทีม" : "ลบไม่สำเร็จ");
    }
  }

  async function uploadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("taskId", task.id);
    fd.append("file", file);
    const res = await fetch("/api/attachments", { method: "POST", body: fd });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (res.ok) loadAttachments();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "อัปโหลดไม่สำเร็จ");
    }
  }

  // leader ยืนยันงานผ่าน → เก็บเข้าประวัติ + เคลียร์ออกจากกิ่ง
  async function approve() {
    setBusy(true);
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, approve: true }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      alert("ยืนยันไม่สำเร็จ");
    }
  }

  // leader ตีกลับงานที่ done → กลับไป in_progress + ทำเครื่องหมาย + คอมเมนต์ feedback
  async function reject() {
    if (!rejectText.trim()) return;
    setBusy(true);
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status: "in_progress", needs_revision: true }),
    });
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, body: "↩ ตีกลับให้แก้ไข: " + rejectText.trim() }),
    });
    setBusy(false);
    router.refresh();
    onClose();
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!edit.title.trim()) return;
    setBusy(true);
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task.id,
        title: edit.title.trim(),
        description: edit.description,
        priority: edit.priority,
        deadline: edit.deadline || null,
        assigned_to: edit.assigned_to,
        tags: edit.tags.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
      onClose();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error === "forbidden" ? "แก้ไขได้เฉพาะหัวหน้าทีม" : "บันทึกไม่สำเร็จ");
    }
  }

  async function deleteTask() {
    if (!confirm("ลบงานนี้? การลบไม่สามารถย้อนกลับได้")) return;
    setBusy(true);
    const res = await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      alert("ลบไม่สำเร็จ");
    }
  }

  const pri = priorityStyle[task.priority] || priorityStyle.medium;
  const curStatus = STATUSES.find((s) => s.key === status) || STATUSES[0];
  const isLeader = !canComment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div>
            <h2 className="text-lg font-bold text-ink">{task.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-2">
              <span>🗓 {task.deadline}</span>
              <span className="rounded-full px-2 py-0.5 font-semibold" style={{ color: pri.color, background: pri.bg }}>
                {pri.label}
              </span>
              {(task.assignees?.length ? task.assignees : [task.assignee])
                .filter((a) => a?.name && a.name !== "—")
                .map((a) => a.name)
                .join(", ") && (
                <span>
                  · 👥{" "}
                  {(task.assignees?.length ? task.assignees : [task.assignee])
                    .filter((a) => a?.name && a.name !== "—")
                    .map((a) => a.name)
                    .join(", ")}
                </span>
              )}
            </div>
            {task.tags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {task.tags.map((t) => (
                  <span key={t} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] text-ink-2">#{t}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {canEdit && !editing && (
              <button onClick={() => setEditing(true)} title="แก้ไขงาน" className="text-sm font-semibold text-brand hover:underline">
                ✏️ แก้ไข
              </button>
            )}
            <button onClick={onClose} className="text-ink-3 hover:text-ink">✕</button>
          </div>
        </div>

        {editing ? (
          <form onSubmit={saveEdit} className="flex-1 space-y-3 overflow-y-auto p-5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">ชื่องาน</label>
              <input
                autoFocus
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">รายละเอียด</label>
              <textarea
                value={edit.description}
                onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                rows={3}
                placeholder="อธิบายรายละเอียดงาน..."
                className="w-full resize-none rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-ink-2">ความด่วน</label>
                <select value={edit.priority} onChange={(e) => setEdit({ ...edit, priority: e.target.value })} className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-brand">
                  <option value="low">ต่ำ (Low)</option>
                  <option value="medium">ปานกลาง (Medium)</option>
                  <option value="high">สูง (High)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-ink-2">กำหนดส่ง</label>
                <input type="date" value={edit.deadline || ""} onChange={(e) => setEdit({ ...edit, deadline: e.target.value })} className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">มอบหมายให้ (เลือกได้หลายคน)</label>
              <AssigneeSelect members={members} currentUserId={currentUserId} value={edit.assigned_to} onChange={(v) => setEdit({ ...edit, assigned_to: v })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">แท็ก</label>
              <input
                value={edit.tags}
                onChange={(e) => setEdit({ ...edit, tags: e.target.value })}
                placeholder="คั่นด้วย , เช่น Design, Frontend"
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditing(false)} className="rounded-[10px] border border-line px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2">ยกเลิก</button>
              <button type="submit" disabled={busy} className="rounded-[10px] bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                {busy ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>
          </form>
        ) : (
        <div className="flex-1 overflow-y-auto p-5">
          {task.description && (
            <div className="mb-4 whitespace-pre-wrap rounded-xl bg-surface-2/60 px-3.5 py-3 text-sm leading-relaxed text-ink-2">
              {task.description}
            </div>
          )}

          {needsRev && (
            <div className="mb-4 rounded-xl border border-[rgba(193,57,43,.25)] bg-[rgba(193,57,43,.06)] px-3 py-2 text-sm font-medium text-[#c1392b]">
              ↩ งานนี้ถูกตีกลับให้แก้ไข — ดูรายละเอียดในความคืบหน้าด้านล่าง
            </div>
          )}

          {task.approved && (
            <div className="mb-4 rounded-xl border border-brand/30 bg-brand-soft px-3 py-2 text-sm font-semibold text-brand-dark">
              🎉 งานนี้ผ่านการตรวจแล้ว — ถูกเก็บเข้าประวัติงานเสร็จ
            </div>
          )}

          {/* status */}
          <div className="mb-5">
            <div className="mb-2 text-xs font-semibold text-ink-2">
              สถานะงาน {isLeader && <span className="font-normal text-ink-3">(ผู้รับผิดชอบเป็นผู้อัปเดต)</span>}
            </div>
            {isLeader ? (
              <span
                className="inline-block rounded-full px-3 py-1.5 text-[12px] font-semibold"
                style={{ background: curStatus.bg, color: curStatus.color }}
              >
                {curStatus.label}
              </span>
            ) : (
              <div className="flex gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => changeStatus(s.key)}
                    className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all"
                    style={
                      status === s.key
                        ? { background: s.bg, color: s.color }
                        : { background: "#fff", color: "#9A9A9A", boxShadow: "inset 0 0 0 1px #E4E4E4" }
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* ผู้มีสิทธิ์ตรวจงาน: ยืนยันผ่าน / ตีกลับ งานที่เสร็จแล้ว */}
            {canReview && status === "done" && !task.approved && (
              <div className="mt-3">
                {!rejecting ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={approve}
                      disabled={busy}
                      className="rounded-[10px] bg-brand px-3 py-2 text-[13px] font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                    >
                      ✅ ยืนยันงานผ่าน
                    </button>
                    <button
                      onClick={() => setRejecting(true)}
                      className="rounded-[10px] border border-[#c1392b] px-3 py-2 text-[13px] font-semibold text-[#c1392b] hover:bg-[rgba(193,57,43,.06)]"
                    >
                      ↩ ตีกลับให้แก้ไข
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      value={rejectText}
                      onChange={(e) => setRejectText(e.target.value)}
                      rows={3}
                      placeholder="บอกสิ่งที่ต้องแก้ไข..."
                      className="w-full resize-none rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-[#c1392b] focus:ring-2 focus:ring-[rgba(193,57,43,.12)]"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setRejecting(false)} className="rounded-[10px] border border-line px-3 py-1.5 text-sm font-semibold text-ink-2 hover:bg-surface-2">
                        ยกเลิก
                      </button>
                      <button
                        onClick={reject}
                        disabled={busy}
                        className="rounded-[10px] bg-[#c1392b] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        ตีกลับ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* attachments */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-2">ไฟล์ / รูปแนบ</span>
              {canComment && (
                <>
                  <button onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-brand hover:underline">
                    {uploading ? "กำลังอัปโหลด..." : "+ แนบไฟล์"}
                  </button>
                  <input ref={fileRef} type="file" className="hidden" onChange={uploadFile} />
                </>
              )}
            </div>
            {attachments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line py-4 text-center text-xs text-ink-3">ยังไม่มีไฟล์แนบ</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {attachments.map((a) =>
                  (a.file_type || "").startsWith("image/") ? (
                    <div key={a.id} className="group relative">
                      <a href={a.file_url} target="_blank" rel="noreferrer">
                        <img src={a.file_url} alt={a.file_name} className="h-20 w-20 rounded-lg border border-line object-cover" />
                      </a>
                      {canComment && (
                        <button
                          onClick={() => deleteAttachment(a.id)}
                          title="ลบไฟล์"
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c1392b] text-[11px] text-white shadow opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <div key={a.id} className="flex items-center gap-1 rounded-lg border border-line py-1.5 pl-2.5 pr-1.5 text-xs text-ink-2">
                      <a href={a.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline">
                        📎 {a.file_name}
                      </a>
                      {canComment && (
                        <button onClick={() => deleteAttachment(a.id)} title="ลบไฟล์" className="ml-1 text-ink-3 hover:text-[#c1392b]">
                          ✕
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* progress / comments */}
          <div>
            <div className="mb-2 text-xs font-semibold text-ink-2">
              ความคืบหน้า{canComment ? " / คอมเมนต์" : " & การตีกลับ"}
            </div>
            <div className="space-y-2.5">
              {comments.length === 0 && (
                <div className="text-xs text-ink-3">
                  {canComment ? "ยังไม่มีอัปเดต — เขียนความคืบหน้าได้เลย" : "ผู้รับผิดชอบยังไม่ได้อัปเดต"}
                </div>
              )}
              {comments.map((c) => (
                <div key={c.id} className="rounded-xl bg-surface-2/70 px-3 py-2">
                  <div className="text-[11px] font-semibold text-ink">{c.author}</div>
                  <div className="whitespace-pre-wrap text-sm text-ink-2">{c.body}</div>
                </div>
              ))}
            </div>
            {canComment && (
              <>
                <form onSubmit={addComment} className="mt-3 flex gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="อัปเดตความคืบหน้า..."
                    className="flex-1 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
                  />
                  <button type="submit" disabled={busy} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                    {busy ? "กำลังส่ง..." : "ส่ง"}
                  </button>
                </form>
                {sent && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand animate-fade-up">
                    ✓ ส่งความคืบหน้าเรียบร้อยแล้ว
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        )}

        {/* footer: ผู้มีสิทธิ์จัดการงาน ลบงาน */}
        {canEdit && !editing && (
          <div className="border-t border-line px-5 py-3">
            <button onClick={deleteTask} disabled={busy} className="text-sm font-semibold text-[#c1392b] hover:underline disabled:opacity-60">
              🗑 ลบงานนี้
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
