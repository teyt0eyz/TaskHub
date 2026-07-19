"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PERMS = [
  { key: "review", label: "Review work", desc: "Approve or return work members finish (e.g. a mentor reviewing interns)" },
  { key: "manage_tasks", label: "Manage tasks", desc: "Create, edit, delete and assign tasks" },
  { key: "manage_members", label: "Manage members", desc: "Approve join requests and remove members" },
  { key: "settings", label: "Project settings", desc: "Change name / visibility / join mode" },
  { key: "ai", label: "AI summary", desc: "Use Gemini to summarize (shares 4 credits/month with the leader)" },
];

export default function PromoteMemberButton({ projectId, userId, name, currentRole = "member", currentPermissions = [], currentTitle = "" }) {
  const router = useRouter();
  const isTargetLeader = currentRole === "leader";
  const [open, setOpen] = useState(false);
  const [isDeputy, setIsDeputy] = useState(currentRole === "deputy");
  const [perms, setPerms] = useState(currentPermissions?.length ? currentPermissions : ["review"]);
  const [title, setTitle] = useState(currentTitle || "");
  const [busy, setBusy] = useState(false);

  const toggle = (k) => setPerms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  async function save() {
    setBusy(true);
    // ผู้ช่วยที่ไม่ติ๊กสิทธิ์ใดเลย = กลายเป็นRegular member (หมดสิทธิ์เข้าหน้าจัดการ)
    const nextRole = isDeputy && perms.length > 0 ? "deputy" : "member";
    const res = await fetch("/api/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        user_id: userId,
        role: nextRole,
        permissions: nextRole === "deputy" ? perms : [],
        title,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      alert("Save failed");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-[9px] border border-line px-2.5 py-1 text-xs font-semibold text-ink-2 hover:bg-surface-2"
      >
        ⚙ Role
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ink">Role for {name}</h2>
            <p className="mt-0.5 text-sm text-ink-2">Set the display title and grant permissions</p>

            {/* custom role title */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-ink-2">Role title (display)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={30}
                placeholder="e.g. Teacher / TA / Student / Mentor"
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
              <p className="mt-1 text-[11px] text-ink-3">Optional — defaults to the permission level (Leader / Deputy / Member)</p>
            </div>

            {isTargetLeader ? (
              <div className="mt-4 rounded-xl bg-surface-2 px-3 py-2.5 text-[13px] text-ink-2">
                This person is the <b className="text-ink">leader</b> of the project — you can only change their display title
              </div>
            ) : (
              <>
                {/* permission level */}
                <div className="mt-4 mb-1 text-xs font-semibold text-ink-2">Permission level</div>
                <div className="flex rounded-xl bg-surface-2 p-1">
                  <button
                    onClick={() => setIsDeputy(false)}
                    className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition-all ${!isDeputy ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink"}`}
                  >
                    Regular member
                  </button>
                  <button
                    onClick={() => setIsDeputy(true)}
                    className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition-all ${isDeputy ? "bg-white text-brand-dark shadow-sm" : "text-ink-2 hover:text-ink"}`}
                  >
                    ⭐ Deputy (grant access)
                  </button>
                </div>

                {isDeputy && (
                  <div className="mt-4 space-y-2">
                    {PERMS.map((p) => (
                      <label
                        key={p.key}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                          perms.includes(p.key) ? "border-brand bg-brand-soft" : "border-line hover:bg-surface-2"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={perms.includes(p.key)}
                          onChange={() => toggle(p.key)}
                          className="mt-0.5 h-4 w-4 accent-[#2E9E5B]"
                        />
                        <div>
                          <div className="text-[13px] font-semibold text-ink">{p.label}</div>
                          <div className="text-[11px] text-ink-3">{p.desc}</div>
                        </div>
                      </label>
                    ))}
                    {perms.length === 0 && (
                      <p className="text-[11px] font-medium text-danger">
                        ⚠ No permissions selected — saving makes them a regular member (no access to management pages)
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-[10px] border border-line px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="rounded-[10px] bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {busy ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
