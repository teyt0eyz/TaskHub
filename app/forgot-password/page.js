"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell, { Field, SubmitButton } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setSent(true);
    if (data.devLink) setDevLink(data.devLink);
  }

  return (
    <AuthShell
      title="ลืมรหัสผ่าน"
      subtitle="กรอกอีเมลของคุณ เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้"
      footer={
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
          ← กลับไปเข้าสู่ระบบ
        </Link>
      }
    >
      {sent ? (
        <div className="mt-7 space-y-3">
          <p className="rounded-lg bg-brand/10 px-3 py-3 text-sm leading-relaxed text-brand-dark">
            ถ้าอีเมลนี้มีบัญชีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว
            กรุณาตรวจสอบกล่องจดหมาย (ลิงก์หมดอายุใน 1 ชั่วโมง)
          </p>
          {/* dev: แสดงลิงก์ตรง ๆ ตอนยังไม่ได้ตั้งระบบส่งอีเมล */}
          {devLink && (
            <p className="break-all rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-2">
              (dev){" "}
              <a href={devLink} className="font-medium text-brand underline">
                {devLink}
              </a>
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <Field
            label="อีเมล"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <SubmitButton type="submit" loading={loading}>
            ส่งลิงก์รีเซ็ตรหัสผ่าน
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
