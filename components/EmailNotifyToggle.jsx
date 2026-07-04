"use client";

import { useEffect, useState } from "react";

// สวิตช์เปิด/ปิด "Email notifications" (ระดับบัญชี) — วางในเมนูผู้ใช้
export default function EmailNotifyToggle() {
  const [on, setOn] = useState(null); // null = Loading
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/preferences", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setOn(d.emailNotifications !== false);
      })
      .catch(() => {});
  }, []);

  async function toggle() {
    if (on === null || busy) return;
    const next = !on;
    setOn(next);
    setBusy(true);
    try {
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifications: next }),
      });
    } catch {
      setOn(!next); // rollback ถ้าพลาด
    }
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={on === null || busy}
      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] font-medium text-ink-2 hover:bg-surface-2 disabled:opacity-60"
      title="Toggle email notifications"
    >
      <span>Email notifications</span>
      <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${on ? "bg-brand" : "bg-line"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}
