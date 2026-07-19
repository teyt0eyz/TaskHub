"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PendingRequests({ requests = [], projectId }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  async function act(id, action) {
    setBusyId(id);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setBusyId(null);
    if (res.ok) router.refresh();
    else alert("Action failed");
  }

  async function actAll(action) {
    if (action === "reject_all" && !confirm("Reject all requests?")) return;
    setBulkBusy(true);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, action }),
    });
    setBulkBusy(false);
    if (res.ok) router.refresh();
    else alert("Action failed");
  }

  if (requests.length === 0) return null;

  return (
    <div className="mb-5 rounded-2xl border border-[rgba(255,107,43,.3)] bg-accent-soft p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
        🔔 Join requests
        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">{requests.length}</span>
        {requests.length > 1 && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => actAll("approve_all")}
              disabled={bulkBusy}
              className="rounded-[9px] bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              ✓ Approve all
            </button>
            <button
              onClick={() => actAll("reject_all")}
              disabled={bulkBusy}
              className="rounded-[9px] border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-surface-2 disabled:opacity-60"
            >
              Reject all
            </button>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{ background: r.bg, color: r.color }}
            >
              {r.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">{r.name}</div>
              <div className="truncate text-xs text-ink-3">{r.email}</div>
            </div>
            <button
              onClick={() => act(r.id, "approve")}
              disabled={busyId === r.id}
              className="rounded-[9px] bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              Approve
            </button>
            <button
              onClick={() => act(r.id, "reject")}
              disabled={busyId === r.id}
              className="rounded-[9px] border border-line px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-surface-2 disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
