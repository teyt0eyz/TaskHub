"use client";

import { useEffect, useRef, useState } from "react";

export default function AssigneeSelect({ members = [], value = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  const label =
    value.length === 0
      ? "มอบหมายให้ฉัน (ค่าเริ่มต้น)"
      : value.length === 1
      ? members.find((m) => m.id === value[0])?.name || "1 คน"
      : `เลือกแล้ว ${value.length} คน`;

  const filtered = members.filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm outline-none hover:border-brand focus:border-brand"
      >
        <span className={value.length ? "text-ink" : "text-ink-3"}>{label}</span>
        <span className="text-ink-3">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-line bg-white shadow-[0_8px_24px_rgba(0,0,0,.12)]">
          <div className="border-b border-line p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="🔍 ค้นหาสมาชิก..."
              className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand"
            />
          </div>
          <div className="scroll-soft max-h-52 overflow-y-auto overscroll-contain py-1">
            {members.length === 0 && (
              <div className="px-3 py-2 text-xs text-ink-3">ไม่มีสมาชิก — จะมอบให้ตัวเอง</div>
            )}
            {members.length > 0 && filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-ink-3">ไม่พบสมาชิกที่ค้นหา</div>
            )}
            {filtered.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-surface-2">
                <input
                  type="checkbox"
                  checked={value.includes(m.id)}
                  onChange={() => toggle(m.id)}
                  className="h-4 w-4 accent-[#FF6B2B]"
                />
                <span className="text-sm text-ink">{m.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
