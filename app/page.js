import Link from "next/link";
import Reveal from "@/components/Reveal";

/* ---------- workspace tree preview (hero visual) ---------- */

const CARD_W = 158;
const CARD_H = 120;
const HEAD_H = 60;
const GREEN = "#2E9E5B";

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

function TaskMini({ x, y, badge, title, tag, tagColor, bar, deadline, deadlineColor = "#5A5A5A", priority, initials, avBg, avColor, status, demo }) {
  return (
    <div
      className="absolute rounded-[10px] border border-line bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,.07)]"
      style={{ left: x, top: y, width: CARD_W, height: CARD_H }}
    >
      {badge != null && (
        <span className="absolute -left-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand text-[9px] font-bold text-white shadow-sm">
          {badge}
        </span>
      )}
      {demo ? (
        <div className="demo-bar absolute inset-x-0 top-0 h-[3px] rounded-t-[10px]" />
      ) : (
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[10px]" style={{ background: bar }} />
      )}
      <div className="pt-0.5 text-[12px] font-medium leading-snug text-ink">{title}</div>
      <div className="mt-2">
        <span className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: `${tagColor}1f`, color: tagColor }}>
          {tag}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: deadlineColor }}>🗓 {deadline}</span>
        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: priority.bg, color: priority.color }}>
          {priority.label}
        </span>
      </div>
      <div className="my-2 h-px bg-line-soft" />
      <div className="flex items-center justify-between">
        <div className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-semibold" style={{ background: avBg, color: avColor }}>
          {initials}
        </div>
        {demo ? (
          <span className="relative inline-flex h-[16px] w-[76px] justify-end">
            <span className="demo-todo absolute right-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: ST.todo.bg, color: ST.todo.color }}>Todo</span>
            <span className="demo-done absolute right-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: ST.done.bg, color: ST.done.color }}>Done ✓</span>
          </span>
        ) : (
          <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: status.bg, color: status.color }}>
            {status.label}
          </span>
        )}
      </div>
    </div>
  );
}

function MemberHead({ x, y, name, initials, bg, color }) {
  return (
    <div
      className="absolute flex items-center rounded-[14px] border-2 bg-white px-3 shadow-[0_3px_12px_rgba(255,107,43,.15)]"
      style={{ left: x, top: y, width: CARD_W, height: HEAD_H, borderColor: "#FF6B2B" }}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[11px] font-semibold" style={{ borderColor: "#FF6B2B", background: bg, color }}>
          {initials}
        </div>
        <div>
          <div className="text-[13px] font-semibold leading-none text-ink">{name}</div>
          <span className="mt-1 inline-block rounded bg-accent px-1.5 py-0.5 text-[8px] font-semibold uppercase text-white">Member</span>
        </div>
      </div>
    </div>
  );
}

// แต่ละคนมีจำนวนงานไม่เท่ากัน (ซ้อนลงมา) → ผังดูมีมิติ
const COLUMNS = [
  {
    name: "Mira", initials: "MJ", avBg: "#FFE6D6", avColor: "#b8521f",
    tasks: [
      { title: "Design landing page", tag: "Design", tagColor: "#2E9E5B", bar: "#FF6B2B", deadline: "Jul 3", priority: PRI.high, status: ST.inprog },
      { title: "Refine onboarding flow", tag: "UX", tagColor: "#6b3fa0", bar: "#C4C4C4", deadline: "Jul 8", priority: PRI.medium, status: ST.todo },
    ],
  },
  {
    name: "Theo", initials: "TP", avBg: "#E0EEFF", avColor: "#2c5b9e",
    tasks: [
      { title: "Write API docs", tag: "Docs", tagColor: "#5A5A5A", bar: "#FF6B2B", deadline: "Jul 5", priority: PRI.medium, status: ST.inprog },
      { title: "Set up Supabase schema", tag: "Backend", tagColor: "#2c5b9e", bar: "#C4C4C4", deadline: "Jul 6", priority: PRI.high, status: ST.todo },
      { title: "Deploy to Vercel", tag: "DevOps", tagColor: "#2E9E5B", bar: "#2E9E5B", deadline: "Jul 9", priority: PRI.low, status: ST.done },
    ],
  },
  {
    name: "Sora", initials: "SK", avBg: "#EDE0FF", avColor: "#6b3fa0",
    tasks: [
      { title: "Fix login bug", tag: "Bug", tagColor: "#2c5b9e", bar: "#FF6B2B", deadline: "Jul 2", deadlineColor: "#FF6B2B", priority: PRI.high, status: ST.todo, demo: true },
    ],
  },
];

function TreePreview() {
  const W = 620;
  const SCALE = 0.7;
  const ROW_GAP = 24;
  const lcx = 310;
  const cols = [100, 310, 520];
  const colX = cols.map((c) => c - CARD_W / 2);
  const busY = 132;
  const headY = 158;
  const cardY = headY + HEAD_H + 30;
  const maxRows = Math.max(...COLUMNS.map((c) => c.tasks.length));
  const H = cardY + maxRows * CARD_H + (maxRows - 1) * ROW_GAP + 16;

  const seg = (d, key, arrow) => (
    <path key={key} d={d} fill="none" stroke={GREEN} strokeWidth={1.5} markerEnd={arrow ? "url(#hah)" : undefined} />
  );

  return (
    <div className="relative mx-auto" style={{ width: W * SCALE, height: H * SCALE, maxWidth: "100%" }}>
      <div className="relative" style={{ width: W, height: H, transform: `scale(${SCALE})`, transformOrigin: "top left" }}>
        <svg width={W} height={H} className="absolute inset-0" style={{ overflow: "visible" }}>
          <defs>
            <marker id="hah" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M1,1 L6,4 L1,7 Z" fill={GREEN} />
            </marker>
          </defs>
          {seg(`M ${lcx} 88 L ${lcx} ${busY}`, "trunk")}
          {seg(`M ${cols[0]} ${busY} L ${cols[2]} ${busY}`, "bus")}
          {cols.map((c, i) => seg(`M ${c} ${busY} L ${c} ${headY}`, `h${i}`, true))}
          {cols.map((c, i) => seg(`M ${c} ${headY + HEAD_H} L ${c} ${cardY}`, `t${i}`, true))}
          {/* เส้นเชื่อมงานที่ซ้อนกันในแต่ละคอลัมน์ */}
          {COLUMNS.flatMap((col, i) =>
            col.tasks.slice(0, -1).map((_, j) => {
              const yBottom = cardY + (j + 1) * CARD_H + j * ROW_GAP;
              return seg(`M ${cols[i]} ${yBottom} L ${cols[i]} ${yBottom + ROW_GAP}`, `s${i}-${j}`, true);
            })
          )}
        </svg>

        <div className="absolute flex h-[70px] items-center rounded-[14px] border-2 border-brand bg-white px-4 shadow-[0_3px_14px_rgba(46,158,91,.18)]" style={{ left: lcx - 90, top: 16, width: 180 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-brand bg-brand-soft text-sm font-semibold text-brand-dark">AK</div>
            <div>
              <div className="text-[15px] font-semibold leading-none text-ink">Akarawin</div>
              <span className="mt-1.5 inline-block rounded bg-brand px-2 py-0.5 text-[9px] font-semibold uppercase text-white">Leader</span>
            </div>
          </div>
        </div>

        {COLUMNS.map((col, i) => (
          <MemberHead key={`head-${i}`} x={colX[i]} y={headY} name={col.name} initials={col.initials} bg={col.avBg} color={col.avColor} />
        ))}

        {COLUMNS.flatMap((col, i) =>
          col.tasks.map((t, j) => (
            <TaskMini
              key={`${i}-${j}`}
              x={colX[i]}
              y={cardY + j * (CARD_H + ROW_GAP)}
              badge={j + 1}
              initials={col.initials}
              avBg={col.avBg}
              avColor={col.avColor}
              {...t}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ---------- app-window frame (ollama-style product shot) ---------- */

function WindowFrame({ children }) {
  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-white shadow-[0_40px_90px_-30px_rgba(0,0,0,.28)]">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-lg font-medium text-ink-3">TaskHub · Workspace</span>
      </div>
      <div className="dot-grid flex items-center justify-center px-4 py-8">{children}</div>
    </div>
  );
}

const features = [
  { emoji: "🌳", title: "Workspace tree view", desc: "See the whole team's work as a map — who's assigned what and what everyone is doing, all in one view." },
  { emoji: "😄", title: "Daily mood check-in", desc: "Members log their mood daily so leaders instantly spot who's stuck and can step in on time." },
  { emoji: "🤖", title: "AI work summaries", desc: "Let Gemini summarize your team's work and mood — download or print the report." },
];

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0b3a21] text-white">
      {/* ---------- background layers (เขียวเป็นหลัก) ---------- */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* ไล่เฉดเขียวเข้ม → เขียวสด */}
        <div className="absolute inset-0 bg-linear-to-b from-[#082d18] via-[#0e4629] to-[#0a3a21]" />
        {/* แสงเรืองกลางบน */}
        <div className="absolute -top-48 left-1/2 h-[620px] w-[980px] -translate-x-1/2 rounded-full bg-brand/35 blur-[130px]" />
        {/* แสงมินต์ซ้าย + แสงส้มขวา (accent) */}
        <div className="absolute top-1/4 -left-24 h-96 w-96 rounded-full bg-[#34d399]/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-accent/15 blur-[110px]" />
        {/* จุดลายขาวจาง ๆ */}
        <div className="dot-grid-green absolute inset-0 opacity-40" />
        {/* วงกลมลอยตกแต่ง */}
        <div className="animate-floaty-slow absolute left-[8%] top-40 h-3 w-3 rounded-full bg-white/40" />
        <div className="animate-floaty absolute right-[12%] top-28 h-2.5 w-2.5 rounded-full bg-[#8ff0b4]/70" />
        <div className="animate-floaty-slow absolute right-[22%] top-64 h-2 w-2 rounded-full bg-accent/60" />
      </div>

      {/* ---------- Nav (glass) ---------- */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b3a21]/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-lg ring-1 ring-white/15">🌳</span>
            <span className="font-heading text-lg font-bold text-white">Task<span style={{ color: "#8ff0b4" }}>Hub</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <a href="#features" className="hidden rounded-lg px-3.5 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:block">
              Features
            </a>
            <Link href="/login" className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-brand-dark shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative flex-1 px-5 pb-8 pt-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 shadow-sm backdrop-blur">
            ✨ Track your team's tasks + mood in one place
          </span>
          <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-sm sm:text-6xl">
            Manage team work<br />and stay <span className="hl-brush-light" style={{ color: "#8ff0b4" }}>productive</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/75">
            Assign tasks, track progress, and look after your team's mood — all in one place.
            Perfect for work teams, teachers &amp; students, or a group of friends.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-white px-7 py-3 text-sm font-bold text-brand-dark shadow-[0_12px_28px_rgba(0,0,0,.3)] transition-transform hover:-translate-y-0.5"
            >
              Get started free →
            </Link>
            <a href="#features" className="rounded-xl border border-white/25 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10">
              See features
            </a>
          </div>
        </div>

        {/* product shot — การ์ดขาวเด้งบนพื้นเขียว */}
        <div className="mx-auto mt-14 max-w-3xl px-1">
          <Reveal>
            <WindowFrame>
              <TreePreview />
            </WindowFrame>
          </Reveal>
        </div>
      </section>

      {/* ---------- Features (glass cards) ---------- */}
      <section id="features" className="relative border-t border-white/10 px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mx-auto mb-12 max-w-lg text-center">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">Everything your team needs</h2>
            <p className="mt-2 text-white/65">Designed to give you your whole team at a glance.</p>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 120}>
                <div className="group flex h-full flex-col items-center rounded-2xl border border-white/10 bg-white/[0.06] p-7 text-center shadow-[0_8px_30px_rgba(0,0,0,.18)] backdrop-blur transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.1]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl ring-1 ring-white/15 transition-transform group-hover:scale-110">{f.emoji}</div>
                  <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA — การ์ดขาวลอย ---------- */}
      <section className="relative px-5 pb-20">
        <Reveal className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white px-6 py-14 text-center shadow-[0_24px_70px_rgba(0,0,0,.3)]">
            {/* แสงตกแต่งในการ์ด */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-soft blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent-soft blur-2xl" />
            <div className="relative">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">Ready to make your team more productive?</h2>
              <p className="mx-auto mt-3 max-w-md text-ink-2">Start free today — sign up with email or log in with Google.</p>
              <Link
                href="/login"
                className="mt-7 inline-block rounded-xl bg-brand px-7 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(46,158,91,.35)] transition-transform hover:-translate-y-0.5 hover:bg-brand-dark"
              >
                Get started free →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-white/50 sm:flex-row">
          <span className="font-semibold text-white/70">Task<span style={{ color: "#8ff0b4" }}>Hub</span></span>
          <span>© 2026 TaskHub · Capstone Project</span>
        </div>
      </footer>
    </div>
  );
}
