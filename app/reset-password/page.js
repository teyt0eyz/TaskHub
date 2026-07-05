"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthShell, { Field, SubmitButton } from "@/components/AuthShell";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    if (password !== confirm) return setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");

    setLoading(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error || "ตั้งรหัสผ่านใหม่ไม่สำเร็จ");
    setDone(true);
  }

  if (!token) {
    return (
      <p className="mt-7 rounded-lg bg-accent/10 px-3 py-3 text-sm font-medium text-accent">
        ลิงก์ไม่ถูกต้อง กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่อีกครั้ง
      </p>
    );
  }

  if (done) {
    return (
      <div className="mt-7 space-y-4 text-center">
        <p className="rounded-lg bg-brand/10 px-3 py-3 text-sm font-medium text-brand-dark">
          ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว 🎉
        </p>
        <Link
          href="/login"
          className="inline-block w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(46,158,91,.28)] transition-all hover:-translate-y-0.5 hover:bg-brand-dark"
        >
          เข้าสู่ระบบด้วยรหัสผ่านใหม่
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-4">
      <Field
        label="รหัสผ่านใหม่"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="อย่างน้อย 8 ตัวอักษร"
      />
      <Field
        label="ยืนยันรหัสผ่านใหม่"
        type="password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
      />
      {error && (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent">{error}</p>
      )}
      <SubmitButton type="submit" loading={loading}>
        ตั้งรหัสผ่านใหม่
      </SubmitButton>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="ตั้งรหัสผ่านใหม่" subtitle="กรอกรหัสผ่านใหม่ของคุณด้านล่าง">
      <Suspense fallback={<p className="mt-7 text-center text-sm text-ink-3">กำลังโหลด…</p>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
