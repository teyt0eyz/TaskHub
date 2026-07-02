"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  // เข้าระบบด้วย Google OAuth เท่านั้น (ตาม spec)
  const loginWithGoogle = () => signIn("google", { callbackUrl: "/leader" });

  return (
    <div className="dot-grid relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      {/* soft brand glows */}
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-[380px] animate-pop rounded-3xl border border-line bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,.1)]">
        {/* brand */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white shadow-[0_8px_20px_rgba(46,158,91,.35)]">
            T
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">ยินดีต้อนรับสู่ TaskHub</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
            จัดการงานและ mood ของทีม ในที่เดียว
          </p>
        </div>

        {/* Google sign-in (การกระทำจริงเพียงอย่างเดียว) */}
        <button
          onClick={loginWithGoogle}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-3.5 text-sm font-semibold text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.4 36.5 44 30.8 44 24c0-1.3-.1-2.3-.4-3.5z" />
          </svg>
          เข้าสู่ระบบด้วย Google
        </button>

        <p className="mt-4 text-center text-xs leading-relaxed text-ink-3">
          ปลอดภัย ไม่ต้องตั้งรหัสผ่านใหม่ · เข้าครั้งแรกจะสร้างบัญชีให้อัตโนมัติ
        </p>
      </div>

      {/* back to home */}
      <Link href="/" className="absolute left-5 top-5 z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-white/70 hover:text-ink">
        ← กลับหน้าแรก
      </Link>
    </div>
  );
}
