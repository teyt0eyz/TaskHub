"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTS = [
  { val: false, label: "ต้องอนุมัติก่อน", desc: "หัวหน้ากดยอมรับก่อนถึงเข้าได้" },
  { val: true, label: "เข้าได้เลย", desc: "ใครมีลิงก์/โค้ดเข้าได้ทันที" },
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
    else alert("เปลี่ยนโหมดไม่สำเร็จ");
  }

  return (
    <div className="mb-5 rounded-2xl border border-line bg-white p-4">
      <div className="text-sm font-semibold text-ink">โหมดการเข้าร่วมทีม</div>
      <p className="mt-0.5 text-xs text-ink-2">
        เลือกว่าเมื่อมีคนใช้ลิงก์/โค้ดเชิญ จะต้องให้หัวหน้าอนุมัติก่อน หรือเข้าร่วมได้ทันที — ปรับได้เฉพาะหัวหน้า
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
