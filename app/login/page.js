"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import AuthShell, { Field, SubmitButton } from "@/components/AuthShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = () => signIn("google", { callbackUrl: "/leader" });

  async function loginWithEmail(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    // ไม่ redirect อัตโนมัติ เพื่อจับ error มาแสดงเอง
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    window.location.href = "/leader";
  }

  return (
    <AuthShell
      title={<>Welcome to Task<span style={{ color: "#6fcf97" }}>Hub</span></>}
      subtitle="เข้าสู่ระบบเพื่อจัดการงานและ mood ของทีม"
      footer={
        <>
          ยังไม่มีบัญชี?{" "}
          <Link href="/signup" className="font-semibold text-brand hover:text-brand-dark">
            สมัครสมาชิก
          </Link>
        </>
      }
    >
      <form onSubmit={loginWithEmail} className="mt-7 space-y-4">
        <Field
          label="อีเมล"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <div>
          <Field
            label="รหัสผ่าน"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <div className="mt-1.5 text-right">
            <Link href="/forgot-password" className="text-xs font-medium text-ink-2 hover:text-brand">
              ลืมรหัสผ่าน?
            </Link>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent">{error}</p>
        )}

        <SubmitButton type="submit" loading={loading}>
          เข้าสู่ระบบ
        </SubmitButton>
      </form>

      {/* divider */}
      <div className="my-5 flex items-center gap-3 text-xs text-ink-3">
        <span className="h-px flex-1 bg-line" />
        หรือ
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Google sign-in */}
      <button
        onClick={loginWithGoogle}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.4 36.5 44 30.8 44 24c0-1.3-.1-2.3-.4-3.5z" />
        </svg>
        เข้าสู่ระบบด้วย Google
      </button>
    </AuthShell>
  );
}
