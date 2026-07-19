"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
      {open &&
        mounted &&
        // portal ไป body — กัน modal ติดใน sidebar ที่มี transform (position:fixed จะได้อิง viewport จริง)
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
            <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-xl">
              <h2 className="text-lg font-bold text-ink">Join project</h2>
              <p className="mt-1 text-sm text-ink-2">Paste an invite link or enter the code from a leader</p>
              <input
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Invite link or code"
                className="mt-4 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-[10px] border border-line px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2">
                  Cancel
                </button>
                <button type="submit" className="rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-[#f55e1d]">
                  Join
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </>
  );
}
