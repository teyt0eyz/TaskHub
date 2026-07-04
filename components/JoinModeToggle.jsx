"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTS = [
  { val: false, label: "Requires approval", desc: "A leader must approve before joining" },
  { val: true, label: "Instant join", desc: "Anyone with the link or code joins instantly" },
];

export default function JoinModeToggle({ projectId, value = false }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function set(v) {
    if (v === value || busy) return;
    setBusy(true);
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projectId, auto_approve: v }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("Failed to change mode");
  }

  return (
    <div className="mb-5 rounded-2xl border border-line bg-white p-4">
      <div className="text-sm font-semibold text-ink">Join mode</div>
      <p className="mt-0.5 text-xs text-ink-2">
        Choose whether people who use an invite link or code need leader approval or can join instantly — leaders only
      </p>
      <div className="mt-3 flex w-full max-w-md gap-2">
        {OPTS.map((o) => (
          <button
            key={String(o.val)}
            onClick={() => set(o.val)}
            disabled={busy}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-left transition-all ${
              value === o.val ? "border-brand bg-brand-soft" : "border-line bg-white hover:bg-surface-2"
            }`}
          >
            <div className={`text-[13px] font-semibold ${value === o.val ? "text-brand-dark" : "text-ink"}`}>
              {value === o.val ? "● " : "○ "}
              {o.label}
            </div>
            <div className="mt-0.5 text-[11px] text-ink-3">{o.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
