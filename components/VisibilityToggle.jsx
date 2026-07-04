"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTS = [
  { key: "own", label: "Own tasks only" },
  { key: "all", label: "Everyone’s tasks" },
];

export default function VisibilityToggle({ projectId, value = "own" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function set(v) {
    if (v === value || busy) return;
    setBusy(true);
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projectId, member_visibility: v }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("Failed to change mode");
  }

  return (
    <div className="mb-5 rounded-2xl border border-line bg-white p-4">
      <div className="text-sm font-semibold text-ink">Member visibility</div>
      <p className="mt-0.5 text-xs text-ink-2">
        Choose whether members see only their own tasks or everyone’s branches (others’ tasks dim so yours stand out) — leaders only
      </p>
      <div className="mt-3 flex w-full max-w-sm rounded-xl bg-surface-2 p-1">
        {OPTS.map((o) => (
          <button
            key={o.key}
            onClick={() => set(o.key)}
            disabled={busy}
            className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition-all ${
              value === o.key ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
