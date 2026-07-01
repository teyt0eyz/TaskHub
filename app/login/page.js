"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/* ---------- background decorations ---------- */

function FloatCard({ className, style, anim = "animate-floaty", children }) {
  return (
    <div
      className={`pointer-events-none absolute hidden lg:block ${anim} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function MiniTask({ emoji, title, tag, tagColor, done }) {
  return (
    <div className="w-[190px] rounded-2xl border border-line bg-white p-3.5 shadow-[0_8px_24px_rgba(0,0,0,.08)]">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] ${
            done ? "bg-brand text-white" : "border-[1.5px] border-line text-transparent"
          }`}
        >
          ✓
        </span>
        <span className={`text-[13px] font-medium ${done ? "text-ink-3 line-through" : "text-ink"}`}>
          {title}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span
          className="rounded-full px-2.5 py-[3px] text-[11px] font-medium"
          style={{ background: `${tagColor}1f`, color: tagColor }}
        >
          {tag}
        </span>
        <span className="text-base">{emoji}</span>
      </div>
    </div>
  );
}

function Blob({ className, style, children, anim = "animate-floaty" }) {
  return (
    <div
      className={`pointer-events-none absolute hidden select-none md:flex ${anim} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function Decorations() {
  return (
    <>
      {/* soft color glows */}
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 top-0 h-56 w-56 rounded-full bg-[#6b3fa0]/10 blur-3xl" />

      {/* floating task cards */}
      <FloatCard className="left-[6%] top-[16%]" style={{ "--rot": "-7deg" }}>
        <MiniTask emoji="🎨" title="Design landing page" tag="Design" tagColor="#2E9E5B" done />
      </FloatCard>
      <FloatCard className="left-[9%] bottom-[14%]" anim="animate-floaty-slow" style={{ "--rot": "5deg" }}>
        <MiniTask emoji="🚀" title="Ship v1.0" tag="DevOps" tagColor="#FF6B2B" />
      </FloatCard>
      <FloatCard className="right-[7%] top-[14%]" anim="animate-floaty-slow" style={{ "--rot": "6deg" }}>
        <MiniTask emoji="💡" title="Brainstorm ideas" tag="Creative" tagColor="#6b3fa0" />
      </FloatCard>
      <FloatCard className="right-[8%] bottom-[16%]" style={{ "--rot": "-5deg" }}>
        <MiniTask emoji="🐛" title="Fix login bug" tag="Bug" tagColor="#2c5b9e" done />
      </FloatCard>

      {/* streak / mood pills */}
      <Blob className="left-[18%] top-[42%]" style={{ "--rot": "-4deg" }} anim="animate-floaty-slow">
        <div className="rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-[0_8px_24px_rgba(0,0,0,.08)]">
          🔥 7 วัน streak
        </div>
      </Blob>
      <Blob className="right-[19%] top-[46%]" style={{ "--rot": "5deg" }}>
        <div className="rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-[0_8px_24px_rgba(0,0,0,.08)]">
          😄 รู้สึกดีมาก
        </div>
      </Blob>
      <Blob className="left-[24%] bottom-[26%]" style={{ "--rot": "3deg" }}>
        <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,.08)]">
          <div className="mb-1 text-[11px] font-medium text-ink-2">ความคืบหน้า</div>
          <div className="h-2 w-28 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full w-3/4 rounded-full bg-brand" />
          </div>
        </div>
      </Blob>

      {/* scattered emoji */}
      <Blob className="left-[40%] top-[12%] text-4xl" anim="animate-wiggle" style={{ "--rot": "0deg" }}>✨</Blob>
      <Blob className="right-[38%] bottom-[12%] text-4xl" anim="animate-floaty" style={{ "--rot": "0deg" }}>🎯</Blob>
      <Blob className="left-[32%] bottom-[40%] text-3xl" anim="animate-floaty-slow">⚡</Blob>
      <Blob className="right-[30%] top-[30%] text-3xl" anim="animate-wiggle">🌱</Blob>
      <Blob className="right-[44%] top-[22%] text-2xl" anim="animate-floaty">📌</Blob>
    </>
  );
}

/* ---------- auth card ---------- */

export default function LoginPage() {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const isSignup = mode === "signup";

  // เข้าระบบด้วย Google OAuth เท่านั้น (ตาม spec) — ฟอร์ม email/password เป็น UI ประกอบ
  const loginWithGoogle = () => signIn("google", { callbackUrl: "/leader" });

  const submit = (e) => {
    e.preventDefault();
    loginWithGoogle();
  };

  return (
    <div className="dot-grid relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <Decorations />

      <div className="relative z-10 w-full max-w-[400px] animate-pop rounded-3xl border border-line bg-white/90 p-8 shadow-[0_20px_60px_rgba(0,0,0,.12)] backdrop-blur">
        {/* brand */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 rotate-3 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white shadow-[0_8px_20px_rgba(46,158,91,.4)]">
            T
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {isSignup ? "มาเริ่มกันเลย! 🎉" : "ยินดีต้อนรับกลับ 👋"}
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            {isSignup ? "สร้างบัญชีเพื่อเริ่มจัดการงานของทีม" : "เข้าสู่ระบบเพื่อจัดการงานของทีม"}
          </p>
        </div>

        {/* segmented toggle */}
        <div className="mb-6 flex rounded-xl bg-surface-2 p-1">
          {[
            ["signin", "เข้าสู่ระบบ"],
            ["signup", "สมัครสมาชิก"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === key ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* form */}
        <form onSubmit={submit} className="space-y-3">
          {isSignup && (
            <input
              required
              placeholder="ชื่อของคุณ"
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-brand focus:ring-2 focus:ring-brand-soft"
            />
          )}
          <input
            required
            type="email"
            placeholder="อีเมล"
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-brand focus:ring-2 focus:ring-brand-soft"
          />
          <input
            required
            type="password"
            placeholder="รหัสผ่าน"
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-brand focus:ring-2 focus:ring-brand-soft"
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(46,158,91,.35)] transition-transform hover:-translate-y-0.5 hover:bg-brand-dark active:translate-y-0"
          >
            {isSignup ? "สมัครสมาชิก 🚀" : "เข้าสู่ระบบ →"}
          </button>
        </form>

        {/* divider */}
        <div className="my-5 flex items-center gap-3 text-xs text-ink-3">
          <span className="h-px flex-1 bg-line" />
          หรือ
          <span className="h-px flex-1 bg-line" />
        </div>

        {/* Google */}
        <button
          onClick={loginWithGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.4 36.5 44 30.8 44 24c0-1.3-.1-2.3-.4-3.5z" />
          </svg>
          ดำเนินการต่อด้วย Google
        </button>

        {/* footer switch */}
        <p className="mt-6 text-center text-xs text-ink-2">
          {isSignup ? "มีบัญชีอยู่แล้ว?" : "ยังไม่มีบัญชี?"}{" "}
          <button
            onClick={() => setMode(isSignup ? "signin" : "signup")}
            className="font-semibold text-brand hover:underline"
          >
            {isSignup ? "เข้าสู่ระบบ" : "สมัครสมาชิกเลย"}
          </button>
        </p>
      </div>
    </div>
  );
}
