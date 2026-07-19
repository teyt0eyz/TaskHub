"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// สถานะสำเร็จรูป — เลือกเร็ว หรือจะพิมพ์เองก็ได้
const PRESETS = [
  "🟢 Available",
  "🔴 Busy",
  "📅 In a meeting",
  "🍚 Lunch break",
  "🏠 Working remotely",
  "🎯 Focusing — do not disturb",
];

export default function StatusControl({ projectId, current = null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function save(status) {
    setBusy(true);
    try {
      await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, status }),
      });
    } catch {}
    setBusy(false);
    setOpen(false);
    setText("");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-[10px] border border-line bg-white px-3 py-2 text-sm font-medium text-ink-2 hover:border-brand"
      >
        <span className="text-ink-3">My status:</span>
        <span className="font-semibold text-ink">{current || "— Not set"}</span>
        <span className="text-ink-3">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-64 overflow-hidden rounded-xl border border-line bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,.12)]">
          <div className="px-1 pb-1.5 text-[11px] font-semibold text-ink-3">Choose status</div>
          <div className="flex flex-col gap-0.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                disabled={busy}
                onClick={() => save(p)}
                className={`rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-surface-2 ${current === p ? "bg-brand-soft font-semibold text-brand-dark" : "text-ink"}`}
              >
                {p}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) save(text.trim());
            }}
            className="mt-2 border-t border-line pt-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={60}
              placeholder="✏️ Type your own status..."
              className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand"
            />
            <div className="mt-2 flex justify-between">
              <button
                type="button"
                disabled={busy || !current}
                onClick={() => save("")}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-danger hover:bg-danger-soft disabled:opacity-40"
              >
                Clear status
              </button>
              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-40"
              >
                Set
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
