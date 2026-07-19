"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export default function InviteButton({
  projectId,
  triggerLabel = "🔗 Invite members",
  triggerClassName = "flex items-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(46,158,91,.3)] hover:bg-brand-dark",
}) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function generate() {
    setOpen(true);
    setBusy(true);
    setError("");
    setLink("");
    setCode("");
    setCopied("");
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, role: "member" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `error ${res.status}`);
      setLink(data.url || "");
      setCode(data.token || "");
    } catch (e) {
      setError("Failed to create link: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy(text, which) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button onClick={generate} className={triggerClassName}>
        {triggerLabel}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Invite to project</h2>
              <button onClick={() => setOpen(false)} className="text-ink-3 hover:text-ink">✕</button>
            </div>
            <p className="text-sm text-ink-2">Have members enter the room code or open the link — after signing in they’ll send a request for you to approve</p>

            {busy && <div className="mt-4 text-center text-sm text-ink-2">⏳ Generating code...</div>}

            {error && (
              <div className="mt-4 rounded-lg bg-danger-soft p-3 text-sm text-danger">{error}</div>
            )}

            {code && (
              <>
                <div className="mt-4">
                  <div className="mb-1 text-xs font-semibold text-ink-2">Room code</div>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1 truncate rounded-xl border border-line bg-surface-2 py-3 text-center font-mono text-2xl font-bold tracking-[0.25em] text-ink">
                      {code}
                    </div>
                    <button
                      onClick={() => copy(code, "code")}
                      className="shrink-0 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                      {copied === "code" ? "✓" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 text-xs font-semibold text-ink-2">or share a link</div>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={link}
                      onFocus={(e) => e.target.select()}
                      className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none"
                    />
                    <button
                      onClick={() => copy(link, "link")}
                      className="shrink-0 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-surface-2"
                    >
                      {copied === "link" ? "✓" : "Copy"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
