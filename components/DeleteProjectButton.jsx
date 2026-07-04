"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TrashIcon from "@/components/icons/TrashIcon";

export default function DeleteProjectButton({ projectId, projectName = "" }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function del() {
    if (text.trim() !== projectName.trim()) return;
    setBusy(true);
    const res = await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projectId }),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/leader");
      router.refresh();
    } else {
      alert("Delete failed");
    }
  }

  return (
    <div className="mt-5 border-t border-line pt-4">
      <details onToggle={(e) => !e.currentTarget.open && setConfirming(false)}>
        <summary className="cursor-pointer list-none text-xs font-medium text-ink-3 hover:text-[#c1392b]">
          Danger zone ▾
        </summary>
        <div className="mt-3 rounded-xl border border-[rgba(193,57,43,.25)] bg-[rgba(193,57,43,.04)] p-3">
          <div className="text-[13px] font-semibold text-ink">Delete this project</div>
          <p className="mt-0.5 text-[11px] text-ink-3">
            Permanently deletes all tasks, members, comments and data — this cannot be undone
          </p>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-[9px] border border-[#c1392b] px-3 py-1.5 text-xs font-semibold text-[#c1392b] hover:bg-[rgba(193,57,43,.06)]"
            >
              <TrashIcon size={14} /> Delete project
            </button>
          ) : (
            <div className="mt-2.5 space-y-2">
              <p className="text-[11px] text-ink-2">
                Type the project name <b className="text-ink">{projectName}</b> to confirm
              </p>
              <input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={projectName}
                className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-[#c1392b]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setConfirming(false);
                    setText("");
                  }}
                  className="rounded-[9px] border border-line px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  onClick={del}
                  disabled={busy || text.trim() !== projectName.trim()}
                  className="rounded-[9px] bg-[#c1392b] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? "Deleting..." : "Delete permanently"}
                </button>
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
