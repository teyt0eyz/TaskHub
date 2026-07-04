"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import TrashIcon from "@/components/icons/TrashIcon";

// เมนู "จุดสามจุด" บนการ์ดโปรเจกต์ (หน้าChoose a project) — Delete projectได้ เฉพาะหัวหน้า
export default function ProjectCardMenu({ projectId, projectName }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function del() {
    setBusy(true);
    const res = await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projectId }),
    });
    setBusy(false);
    if (res.ok) {
      setConfirming(false);
      router.refresh();
    } else {
      alert("Delete failed");
    }
  }

  return (
    <div className="absolute right-3 top-3 z-10" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Options"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,.12)]">
          <button
            onClick={() => {
              setOpen(false);
              setConfirming(true);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-[#c1392b] hover:bg-[rgba(193,57,43,.06)]"
          >
            <TrashIcon size={15} /> Delete project
          </button>
        </div>
      )}

      {confirming &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => !busy && setConfirming(false)}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl">
              <h2 className="text-lg font-bold text-ink">Delete project?</h2>
              <p className="mt-1.5 text-sm text-ink-2">
                Delete <b className="text-ink">{projectName}</b> permanently, along with all tasks, members, comments and data — this cannot be undone
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                  className="rounded-[10px] border border-line px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={del}
                  disabled={busy}
                  className="rounded-[10px] bg-[#c1392b] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? "Deleting..." : "Delete permanently"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
