"use client";

import { useState } from "react";
import Link from "next/link";

// เปลือกหน้าตาเดียวกันของทุกหน้า auth (login / signup / forgot / reset) — พื้นหลังเขียวเป็นหลัก
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="dot-grid relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      {/* soft brand glows */}
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-[380px] animate-pop rounded-3xl border border-line bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,.1)]">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-ink-2">{footer}</div>}
      </div>

      {/* back to home */}
      <Link
        href="/"
        className="absolute left-5 top-5 z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-white/70 hover:text-ink"
      >
        ← Back to home
      </Link>
    </div>
  );
}

// อินพุตมาตรฐานของฟอร์ม auth — ถ้าเป็น type="password" จะมีปุ่มลูกตาโชว์/ซ่อนรหัสให้อัตโนมัติ
export function Field({ label, type = "text", ...props }) {
  const isPassword = type === "password";
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <div className="relative">
        <input
          {...props}
          type={inputType}
          className={`w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            isPassword ? "pr-11" : ""
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            title={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-3 transition-colors hover:text-brand"
          >
            <EyeIcon off={show} />
          </button>
        )}
      </div>
    </label>
  );
}

// ลูกตา (off = กำลังแสดงรหัส → โชว์ไอคอนตาขีดทับ)
function EyeIcon({ off }) {
  return off ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M6.61 6.61A18.45 18.45 0 0 0 2 12s3 8 10 8a9.12 9.12 0 0 0 5.39-1.61" />
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ปุ่มหลัก (submit)
export function SubmitButton({ children, loading, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(46,158,91,.28)] transition-all hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {loading ? "กำลังดำเนินการ…" : children}
    </button>
  );
}
