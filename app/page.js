"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

function Nav({ onOpenAuth }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 shadow-[0_1px_3px_rgba(0,0,0,.04)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white shadow-[0_4px_10px_rgba(46,158,91,.3)]">
            T
          </div>
          <span className="text-xl font-bold tracking-tight text-ink">TaskHub</span>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {[
            ["#features", "ฟีเจอร์"],
            ["#how", "วิธีใช้งาน"],
            ["#roles", "เหมาะกับใคร"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenAuth("signin")}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            เข้าสู่ระบบ
          </button>
          <button
            onClick={() => onOpenAuth("signup")}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white shadow-[0_6px_16px_rgba(255,107,43,.35)] transition-transform hover:-translate-y-0.5 hover:bg-[#f55e1d]"
          >
            เริ่มใช้ฟรี
          </button>
        </div>
      </div>
    </header>
  );
}

const CARD_W = 162;
const CARD_H = 144;

/* compact task card used inside the workspace tree preview */
function TaskMini({ x, y, title, tag, tagColor, bar, deadline, deadlineColor = "#5A5A5A", priority, initials, avBg, avColor, status }) {
  return (
    <div
      className="absolute rounded-[10px] border border-line bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,.07)]"
      style={{ left: x, top: y, width: CARD_W, height: CARD_H }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[10px]" style={{ background: bar }} />
      <div className="pt-0.5 text-[12px] font-medium leading-snug text-ink">{title}</div>

      <div className="mt-2">
        <span
          className="rounded-full px-2 py-[2px] text-[9px] font-medium"
          style={{ background: `${tagColor}1f`, color: tagColor }}
        >
          {tag}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: deadlineColor }}>
          🗓 {deadline}
        </span>
        <span
          className="rounded-full px-1.5 py-[2px] text-[9px] font-semibold"
          style={{ background: priority.bg, color: priority.color }}
        >
          {priority.label}
        </span>
      </div>

      <div className="my-2 h-px bg-line-soft" />

      <div className="flex items-center justify-between">
        <div
          className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-semibold"
          style={{ background: avBg, color: avColor }}
        >
          {initials}
        </div>
        <span
          className="rounded-full px-1.5 py-[2px] text-[8px] font-semibold"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}

const GREEN = "#2E9E5B";

// shared style tokens for the preview cards
const PRI = {
  high: { label: "High", color: "#FF6B2B", bg: "rgba(255,107,43,.12)" },
  medium: { label: "Medium", color: "#a07a00", bg: "rgba(245,196,0,.18)" },
  low: { label: "Low", color: "#5A5A5A", bg: "#F0F0F0" },
};
const ST = {
  inprog: { label: "In Progress", color: "#FF6B2B", bg: "rgba(255,107,43,.12)" },
  todo: { label: "Todo", color: "#5A5A5A", bg: "#F0F0F0" },
  done: { label: "Done ✓", color: "#fff", bg: "#2E9E5B" },
};

/* a static miniature of the Leader workspace tree view */
function TreePreview() {
  // canvas coords (W 500 x H 560)
  const W = 500;
  const H = 560;
  const lcx = 250; // center
  const cols = [86, 250, 414]; // card centers
  const colX = cols.map((c) => c - CARD_W / 2);
  const busY = 184;
  const cardY = 214;
  const t4Y = cardY + CARD_H + 30; // below middle card
  const seg = (d, key, arrow) => (
    <path key={key} d={d} fill="none" stroke={GREEN} strokeWidth={1.5} markerEnd={arrow ? "url(#hah)" : undefined} />
  );
  return (
    <div className="relative h-[540px] w-full">
      <div className="relative h-full">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: W, height: H }}>
          <svg width={W} height={H} className="absolute inset-0" style={{ overflow: "visible" }}>
            <defs>
              <marker id="hah" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto" markerUnits="strokeWidth">
                <path d="M1,1 L6,4 L1,7 Z" fill={GREEN} />
              </marker>
            </defs>
            {seg(`M ${lcx} 102 L ${lcx} ${busY}`, "trunk")}
            {seg(`M ${cols[0]} ${busY} L ${cols[2]} ${busY}`, "bus")}
            {seg(`M ${cols[0]} ${busY} L ${cols[0]} ${cardY}`, "d1", true)}
            {seg(`M ${cols[1]} ${busY} L ${cols[1]} ${cardY}`, "d2", true)}
            {seg(`M ${cols[2]} ${busY} L ${cols[2]} ${cardY}`, "d3", true)}
            {seg(`M ${cols[1]} ${cardY + CARD_H} L ${cols[1]} ${t4Y}`, "d4", true)}
          </svg>

          {/* leader node */}
          <div className="absolute flex h-[78px] items-center rounded-[14px] border-2 border-brand bg-white px-4 shadow-[0_3px_14px_rgba(46,158,91,.18)]" style={{ left: lcx - 95, top: 24, width: 190 }}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-brand bg-brand-soft text-sm font-semibold text-brand-dark">
                AK
              </div>
              <div>
                <div className="text-[15px] font-semibold leading-none text-ink">Akarawin</div>
                <span className="mt-1.5 inline-block rounded bg-brand px-2 py-0.5 text-[9px] font-semibold uppercase text-white">
                  Leader
                </span>
              </div>
            </div>
          </div>

          {/* task cards */}
          <TaskMini x={colX[0]} y={cardY} title="Design landing page" tag="Design" tagColor="#2E9E5B" bar="#FF6B2B" deadline="Jul 3" priority={PRI.high} initials="MJ" avBg="#FFE6D6" avColor="#b8521f" status={ST.inprog} />
          <TaskMini x={colX[1]} y={cardY} title="Write API docs" tag="Docs" tagColor="#5A5A5A" bar="#C4C4C4" deadline="Jul 5" priority={PRI.medium} initials="TP" avBg="#E0EEFF" avColor="#2c5b9e" status={ST.todo} />
          <TaskMini x={colX[2]} y={cardY} title="Fix login bug" tag="Bug" tagColor="#2c5b9e" bar="#FF6B2B" deadline="Jul 2 ⚠" deadlineColor="#FF6B2B" priority={PRI.high} initials="SK" avBg="#EDE0FF" avColor="#6b3fa0" status={ST.todo} />
          <TaskMini x={colX[1]} y={t4Y} title="Deploy to Vercel" tag="DevOps" tagColor="#2E9E5B" bar="#2E9E5B" deadline="Jul 6" priority={PRI.low} initials="AK" avBg="rgba(46,158,91,.16)" avColor="#1f7a45" status={ST.done} />
        </div>
      </div>

      {/* playful floating pills (outside the tree) */}
      <div className="absolute right-0 top-6 animate-floaty rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-ink shadow-[0_8px_20px_rgba(0,0,0,.1)]" style={{ "--rot": "5deg" }}>
        🔥 7 วัน streak
      </div>
      <div className="absolute bottom-2 left-0 animate-floaty-slow rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-ink shadow-[0_8px_20px_rgba(0,0,0,.1)]" style={{ "--rot": "-4deg" }}>
        😄 mood: ดีมาก
      </div>
    </div>
  );
}

function Hero({ authOpen, onOpenAuth, authMode, setAuthMode, onCloseAuth }) {
  return (
    <section className="dot-grid relative overflow-hidden">
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 lg:grid-cols-2 lg:py-24">
        <div
          className={`transition-all duration-500 ${
            authOpen ? "pointer-events-none -translate-x-16 opacity-0" : "translate-x-0 opacity-100"
          }`}
        >
          <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3.5 py-1.5 text-xs font-semibold text-accent shadow-sm">
            ✨ ติดตามงาน + mood ของทีม ในที่เดียว
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            จัดการงานทีม
            <br />
            ให้สนุกและ <span className="text-brand">productive</span> 🚀
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-2">
            TaskHub ช่วยให้หัวหน้ามอบหมายงาน ติดตามความคืบหน้า และดูแล mood
            ของทีมได้ในที่เดียว ไม่ว่าจะเป็นทีมงาน อาจารย์กับนักศึกษา หรือกลุ่มเพื่อน
          </p>

          {/* benefit checklist */}
          <ul className="mt-6 space-y-2.5">
            {[
              ["🌳", "เห็นงานทั้งทีมเป็นแผนผัง ซูม-เลื่อนดูได้ลื่นๆ"],
              ["😄", "เช็คอิน mood รายวัน พร้อม streak สะสม"],
              ["🤖", "สรุปผลงานรายสัปดาห์ด้วย AI ในคลิกเดียว"],
            ].map(([emoji, text]) => (
              <li key={text} className="flex items-center gap-3 text-[15px] text-ink">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-sm">
                  {emoji}
                </span>
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenAuth("signup")}
              className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(255,107,43,.35)] transition-transform hover:-translate-y-0.5 hover:bg-[#f55e1d]"
            >
              เริ่มใช้ฟรี →
            </button>
            <a
              href="#how"
              className="rounded-xl border border-line bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              ดูวิธีใช้งาน
            </a>
          </div>

          {/* social proof */}
          <div className="mt-9 flex items-center gap-5 border-t border-line pt-6">
            <div className="flex items-center">
              {[
                ["#FFE6D6", "#b8521f", "MJ"],
                ["#E0EEFF", "#2c5b9e", "TP"],
                ["#EDE0FF", "#6b3fa0", "SK"],
                ["rgba(46,158,91,.16)", "#1f7a45", "AK"],
              ].map(([bg, color, ini], i) => (
                <div
                  key={ini}
                  style={{ background: bg, color, marginLeft: i === 0 ? 0 : -10 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold"
                >
                  {ini}
                </div>
              ))}
            </div>
            <div className="text-sm">
              <div className="font-bold text-ink">50+ ทีม</div>
              <div className="text-ink-2">กำลังใช้ TaskHub จัดการงาน</div>
            </div>
          </div>
          </div>
        </div>

        {/* hero illustration — slides left into the text's place when the drawer opens.
            outer wrapper owns the toggle transform; inner wrapper owns the entrance animation
            (they must be separate elements, otherwise the keyframe locks `transform`). */}
        <div
          className="relative z-10 hidden transition-transform duration-500 ease-out lg:block"
          style={{ transform: authOpen ? "translateX(calc(-100% - 2.5rem))" : "translateX(0)" }}
        >
          <div className="animate-fade-up">
            <TreePreview />
          </div>
        </div>
      </div>

      {/* auth drawer lives inside the hero so it stays below the navbar */}
      <AuthPanel open={authOpen} mode={authMode} setMode={setAuthMode} onClose={onCloseAuth} />
    </section>
  );
}

const features = [
  { emoji: "🌳", title: "Workspace แบบ Tree", desc: "เห็นงานทั้งทีมเป็นแผนผัง ซูม-เลื่อนดูได้ลื่นๆ Member เห็นงานตัวเองเรียงตาม deadline", color: "#2E9E5B" },
  { emoji: "😄", title: "Mood Check-in รายวัน", desc: "บันทึกว่าวันนี้รู้สึกยังไง ทำอะไรไป ติดอะไร หัวหน้าเห็น mood ของทุกคนทันที", color: "#FF6B2B" },
  { emoji: "🔥", title: "Streak & Badge", desc: "เช็คอินทุกวันได้ streak สะสม สร้างนิสัยอัปเดตงานให้สนุกขึ้น", color: "#a07a00" },
  { emoji: "🚧", title: "Blocker Alert", desc: "ถ้าใครติดปัญหา หัวหน้าจะเห็น alert สีแดงทันที เข้าไปช่วยได้ทันเวลา", color: "#c1392b" },
  { emoji: "🤖", title: "AI สรุปรายสัปดาห์", desc: "กดปุ่มเดียว ให้ AI สรุปผลงานและร่าง feedback ของแต่ละคนเป็นภาษาไทย", color: "#6b3fa0" },
  { emoji: "🎯", title: "จัดการงานง่าย", desc: "สร้างงาน กำหนด deadline + priority แล้ว assign ให้สมาชิก ติดตามสถานะได้ครบ", color: "#2c5b9e" },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-ink">ทุกอย่างที่ทีมต้องใช้ 💪</h2>
        <p className="mt-3 text-ink-2">ออกแบบมาให้ใช้ง่าย สนุก และเห็นภาพรวมของทีมได้ในที่เดียว</p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-line bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,.08)]"
          >
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
              style={{ background: `${f.color}1f` }}
            >
              {f.emoji}
            </div>
            <h3 className="text-lg font-semibold text-ink">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const steps = [
  { n: "1", emoji: "🔐", title: "เข้าสู่ระบบ", desc: "ล็อกอินด้วย Google แล้วเลือกบทบาทว่าเป็น Leader หรือ Member" },
  { n: "2", emoji: "📋", title: "สร้าง & รับงาน", desc: "หัวหน้าสร้างงานและ assign ให้ทีม สมาชิกเห็นงานของตัวเองทันที" },
  { n: "3", emoji: "📈", title: "ติดตาม & เช็คอิน", desc: "อัปเดตสถานะงาน เช็คอิน mood รายวัน และให้ AI สรุปผลให้" },
];

function HowItWorks() {
  return (
    <section id="how" className="bg-surface-2/50 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink">ใช้งานง่ายใน 3 ขั้นตอน ✨</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-line bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-base font-bold text-white">
                  {s.n}
                </div>
                <span className="text-3xl">{s.emoji}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roles() {
  return (
    <section id="roles" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-ink">เหมาะกับทุกทีม 🤝</h2>
        <p className="mt-3 text-ink-2">ไม่ว่าจะเป็นที่ทำงาน ห้องเรียน หรือกลุ่มโปรเจกต์</p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-7" style={{ borderTopWidth: 3, borderTopColor: "#2E9E5B" }}>
          <div className="text-3xl">👑</div>
          <h3 className="mt-3 text-xl font-bold text-ink">สำหรับ Leader</h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-2">
            <li className="flex gap-2"><span className="text-brand">✓</span> มอบหมายและติดตามงานทั้งทีม</li>
            <li className="flex gap-2"><span className="text-brand">✓</span> เห็น mood, streak และ blocker ของทุกคน</li>
            <li className="flex gap-2"><span className="text-brand">✓</span> สรุปผลงานรายสัปดาห์ด้วย AI</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-white p-7" style={{ borderTopWidth: 3, borderTopColor: "#FF6B2B" }}>
          <div className="text-3xl">🙋</div>
          <h3 className="mt-3 text-xl font-bold text-ink">สำหรับ Member</h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-2">
            <li className="flex gap-2"><span className="text-accent">✓</span> เห็นงานของตัวเองเรียงตาม deadline</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> อัปเดตสถานะงานได้ง่ายๆ</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> เช็คอินและบันทึก mood รายวัน</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function CTA({ onOpenAuth }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-brand px-8 py-14 text-center text-white shadow-[0_20px_50px_rgba(46,158,91,.35)]">
        <div className="pointer-events-none absolute -left-10 -top-10 text-7xl opacity-20">🚀</div>
        <div className="pointer-events-none absolute -bottom-8 -right-6 text-7xl opacity-20">🎯</div>
        <h2 className="relative text-3xl font-bold tracking-tight">พร้อมทำให้ทีมของคุณ productive แล้วหรือยัง?</h2>
        <p className="relative mx-auto mt-3 max-w-md text-white/80">เริ่มต้นใช้งานฟรีวันนี้ ไม่ต้องใช้บัตรเครดิต</p>
        <button
          onClick={() => onOpenAuth("signup")}
          className="relative mt-7 inline-block rounded-xl bg-white px-7 py-3 text-sm font-bold text-brand-dark transition-transform hover:-translate-y-0.5"
        >
          เริ่มใช้ฟรีเลย →
        </button>
      </div>
    </section>
  );
}

/* Sliding auth drawer — anchored to the right, pushes the hero content left */
function AuthPanel({ open, mode, setMode, onClose }) {
  const isSignup = mode === "signup";

  // Google OAuth เท่านั้น (ตาม spec) — ฟอร์ม email/password เป็น UI ประกอบ
  const loginWithGoogle = () => signIn("google", { callbackUrl: "/leader" });

  const submit = (e) => {
    e.preventDefault();
    loginWithGoogle();
  };

  const inputCls =
    "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-brand focus:ring-2 focus:ring-brand-soft";

  return (
    <>
      {/* transparent click-away within the hero (keeps the pushed tree visible, no dimming) */}
      <div
        onClick={onClose}
        className={`absolute inset-0 z-20 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`absolute bottom-0 right-0 top-0 z-30 flex h-full w-full max-w-[440px] flex-col overflow-y-auto border-l border-line bg-white shadow-[-12px_0_40px_rgba(0,0,0,.12)] transition-transform duration-500 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex flex-1 flex-col justify-center px-8 py-10">
          {/* close */}
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-lg text-ink-2 hover:bg-surface-2"
          >
            ✕
          </button>

          {/* brand */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 rotate-3 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white shadow-[0_8px_20px_rgba(46,158,91,.4)]">
              T
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              {isSignup ? "มาเริ่มกันเลย! 🎉" : "ยินดีต้อนรับกลับ 👋"}
            </h2>
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
            {isSignup && <input required placeholder="ชื่อของคุณ" className={inputCls} />}
            <input required type="email" placeholder="อีเมล" className={inputCls} />
            <input required type="password" placeholder="รหัสผ่าน" className={inputCls} />
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
      </aside>
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-ink-3 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-xs font-bold text-white">T</div>
          <span className="font-semibold text-ink-2">TaskHub</span>
        </div>
        <span>© 2026 TaskHub · Capstone Project</span>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signin");

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthOpen(true);
    // make sure the hero (where the drawer lives) is in view
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-surface">
      <Nav onOpenAuth={openAuth} />
      <Hero
        authOpen={authOpen}
        onOpenAuth={openAuth}
        authMode={authMode}
        setAuthMode={setAuthMode}
        onCloseAuth={() => setAuthOpen(false)}
      />
      <Features />
      <HowItWorks />
      <Roles />
      <CTA onOpenAuth={openAuth} />
      <Footer />
    </div>
  );
}
