"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// รับได้ทั้งโค้ด (token) หรือวางลิงก์เชิญทั้งอัน
function extractToken(input) {
  const s = input.trim();
  const m = s.match(/invite\/([A-Za-z0-9_-]+)/);
  if (m) return m[1]; // จากลิงก์ — ใช้ตามจริง
  return s.toUpperCase(); // กรอกโค้ด 6 หลัก — โค้ดเป็นตัวพิมพ์ใหญ่
}

export default function JoinCodeButton({ className, children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

  function submit(e) {
    e.preventDefault();
    const token = extractToken(code);
    if (!token) return;
    router.push(`/invite/${token}`);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ink">เข้าร่วมโปรเจกต์</h2>
            <p className="mt-1 text-sm text-ink-2">วางลิงก์เชิญ หรือกรอกโค้ดที่ได้รับจากหัวหน้า</p>
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ลิงก์เชิญ หรือ โค้ด"
              className="mt-4 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-[10px] border border-line px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2">
                ยกเลิก
              </button>
              <button type="submit" className="rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-[#f55e1d]">
                เข้าร่วม
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
