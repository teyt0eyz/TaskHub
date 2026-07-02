"use client";

import { useEffect, useState } from "react";

const KEY = "taskhub:gemini-key";

export function readGeminiKey() {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

// ช่องใส่ Gemini API key ของผู้ใช้เอง (เก็บใน localStorage ของเบราว์เซอร์นี้เท่านั้น ไม่ส่งเข้า DB)
// ถ้าใส่แล้ว จะ generate ได้ไม่จำกัด (ใช้โควตาของคีย์ตัวเอง ไม่กินโควตาโปรเจกต์)
export default function GeminiKeyField() {
  const [val, setVal] = useState("");
  const [saved, setSaved] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const k = readGeminiKey();
    setSaved(k);
    setVal(k);
  }, []);

  function broadcast() {
    window.dispatchEvent(new Event("taskhub:gemini-key"));
  }
  function save() {
    try {
      if (val.trim()) localStorage.setItem(KEY, val.trim());
      else localStorage.removeItem(KEY);
    } catch {}
    setSaved(val.trim());
    setEditing(false);
    broadcast();
  }
  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setSaved("");
    setVal("");
    setEditing(false);
    broadcast();
  }

  const masked = saved ? `${saved.slice(0, 6)}••••${saved.slice(-4)}` : "";

  return (
    <div className="rounded-xl border border-line bg-surface-2/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[13px] font-semibold text-ink">🔑 ใช้ API key ของตัวเอง (generate ไม่จำกัด)</div>
        {saved && !editing && (
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-dark">กำลังใช้อยู่</span>
        )}
      </div>

      {saved && !editing ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-ink-2">{masked}</span>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="text-xs font-semibold text-brand hover:underline">แก้</button>
            <button onClick={clear} className="text-xs font-semibold text-[#c1392b] hover:underline">ลบ</button>
          </div>
        </div>
      ) : (
        <div className="mt-2">
          <div className="flex gap-2">
            <input
              type="password"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="วาง Gemini API key..."
              className="flex-1 rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand"
            />
            <button onClick={save} className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">
              บันทึก
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-3">
            เก็บในเบราว์เซอร์นี้เท่านั้น · ขอคีย์ฟรีได้ที่{" "}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-brand hover:underline">
              aistudio.google.com/apikey
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
