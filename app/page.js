import Link from "next/link";
import Reveal from "@/components/Reveal";
import LiveDemo from "@/components/landing/LiveDemo";

/* ---------- workspace tree preview (hero visual) ---------- */

const CARD_W = 158;
const CARD_H = 120;
const HEAD_H = 60;
const GREEN = "#2E9E5B";

/*
 * ภาพตัวอย่างหน้า Workspace บน landing — ใช้สีตายตัวโทนมืดทั้งหมด
 * ห้ามใช้ token ธีม (text-ink / border-line ฯลฯ) เด็ดขาด เพราะ landing
 * เปิดได้ทั้งตอนยังไม่ล็อกอินและตอนผู้ใช้ตั้งธีมมืด — ถ้าใช้ token
 * ตัวอักษรจะพลิกเป็นสีอ่อนทับการ์ดจนอ่านไม่ออก
 */
const SHOT = {
  card: "#151a24",
  cardLine: "rgba(255,255,255,.10)",
  divider: "rgba(255,255,255,.08)",
  title: "rgba(255,255,255,.92)",
  muted: "rgba(255,255,255,.55)",
};

const PRI = {
  high: { label: "High", color: "#ff9d6b", bg: "rgba(255,107,43,.16)" },
  medium: { label: "Medium", color: "#f0cf4a", bg: "rgba(245,196,0,.15)" },
  low: { label: "Low", color: "rgba(255,255,255,.6)", bg: "rgba(255,255,255,.08)" },
};
const ST = {
  inprog: { label: "In Progress", color: "#ff9d6b", bg: "rgba(255,107,43,.16)" },
  todo: { label: "Todo", color: "rgba(255,255,255,.6)", bg: "rgba(255,255,255,.08)" },
  done: { label: "Done ✓", color: "#fff", bg: "#2E9E5B" },
};

function TaskMini({ x, y, badge, title, tag, tagColor, bar, deadline, deadlineColor = SHOT.muted, priority, initials, avBg, avColor, status, demo }) {
  return (
    <div
      className="absolute rounded-[10px] p-3 shadow-[0_6px_18px_rgba(0,0,0,.4)]"
      style={{ left: x, top: y, width: CARD_W, height: CARD_H, background: SHOT.card, border: `1px solid ${SHOT.cardLine}` }}
    >
      {badge != null && (
        <span
          className="absolute -left-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white shadow-sm"
          style={{ border: `2px solid ${SHOT.card}` }}
        >
          {badge}
        </span>
      )}
      {demo ? (
        <div className="demo-bar absolute inset-x-0 top-0 h-[3px] rounded-t-[10px]" />
      ) : (
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[10px]" style={{ background: bar }} />
      )}
      <div className="pt-0.5 text-[12px] font-medium leading-snug" style={{ color: SHOT.title }}>{title}</div>
      <div className="mt-2">
        {/* color-mix รองรับทั้ง hex และ rgba — ต่อสตริง `${tagColor}1f` แบบเดิมพังเมื่อสีเป็น rgba() */}
        <span className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: `color-mix(in srgb, ${tagColor} 15%, transparent)`, color: tagColor }}>
          {tag}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: deadlineColor }}>🗓 {deadline}</span>
        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: priority.bg, color: priority.color }}>
          {priority.label}
        </span>
      </div>
      <div className="my-2 h-px" style={{ background: SHOT.divider }} />
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
      className="absolute flex items-center rounded-[14px] border-2 px-3 shadow-[0_4px_16px_rgba(255,107,43,.22)]"
      style={{ left: x, top: y, width: CARD_W, height: HEAD_H, borderColor: "#FF6B2B", background: SHOT.card }}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[11px] font-semibold" style={{ borderColor: "#FF6B2B", background: bg, color }}>
          {initials}
        </div>
        <div>
          <div className="text-[13px] font-semibold leading-none" style={{ color: SHOT.title }}>{name}</div>
          <span className="mt-1 inline-block rounded bg-accent px-1.5 py-0.5 text-[8px] font-semibold uppercase text-white">Member</span>
        </div>
      </div>
    </div>
  );
}

// แต่ละคนมีจำนวนงานไม่เท่ากัน (ซ้อนลงมา) → ผังดูมีมิติ
// avatar = พื้นโปร่งแสง + ตัวอักษรสว่าง, tag ใช้เฉดสว่างของสีเดิม (ค่าเข้มจะจมบนการ์ดมืด)
const COLUMNS = [
  {
    name: "Mira", initials: "MJ", avBg: "rgba(255,160,107,.18)", avColor: "#ffa06b",
    tasks: [
      { title: "Design landing page", tag: "Design", tagColor: "#6fcf97", bar: "#FF6B2B", deadline: "Jul 3", priority: PRI.high, status: ST.inprog },
      { title: "Refine onboarding flow", tag: "UX", tagColor: "#c4a5e8", bar: "rgba(255,255,255,.22)", deadline: "Jul 8", priority: PRI.medium, status: ST.todo },
    ],
  },
  {
    name: "Theo", initials: "TP", avBg: "rgba(127,179,240,.18)", avColor: "#7fb3f0",
    tasks: [
      { title: "Write API docs", tag: "Docs", tagColor: "rgba(255,255,255,.62)", bar: "#FF6B2B", deadline: "Jul 5", priority: PRI.medium, status: ST.inprog },
      { title: "Set up Supabase schema", tag: "Backend", tagColor: "#7fb3f0", bar: "rgba(255,255,255,.22)", deadline: "Jul 6", priority: PRI.high, status: ST.todo },
      { title: "Deploy to Vercel", tag: "DevOps", tagColor: "#6fcf97", bar: "#2E9E5B", deadline: "Jul 9", priority: PRI.low, status: ST.done },
    ],
  },
  {
    name: "Sora", initials: "SK", avBg: "rgba(196,165,232,.18)", avColor: "#c4a5e8",
    tasks: [
      { title: "Fix login bug", tag: "Bug", tagColor: "#7fb3f0", bar: "#FF6B2B", deadline: "Jul 2", deadlineColor: "#ff9d6b", priority: PRI.high, status: ST.todo, demo: true },
    ],
  },
];

function TreePreview() {
  const W = 620;
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
    <div className="shot-outer">
      <div className="shot-fit" style={{ "--shot-w": `${W}px`, "--shot-h": `${H}px` }}>
        <div className="shot-inner relative">
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

        <div className="absolute flex h-[70px] items-center rounded-[14px] border-2 border-brand px-4 shadow-[0_4px_18px_rgba(46,158,91,.28)]" style={{ left: lcx - 90, top: 16, width: 180, background: SHOT.card }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-brand text-sm font-semibold" style={{ background: "rgba(46,158,91,.18)", color: "#6fcf97" }}>AK</div>
            <div>
              <div className="text-[15px] font-semibold leading-none" style={{ color: SHOT.title }}>Akarawin</div>
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
    </div>
  );
}

/* ---------- app-window frame (ollama-style product shot) ---------- */

function WindowFrame({ children }) {
  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/12 bg-[#0f141d] shadow-[0_40px_100px_-35px_rgba(0,0,0,.85),0_0_0_1px_rgba(255,255,255,.05)]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-sm font-medium text-white/45">TaskHub · Workspace</span>
      </div>
      {/* จุดไข่ปลาเขียนสีตรง ๆ ไม่ใช้ .dot-grid เพราะคลาสนั้นพลิกตามธีมผู้ใช้ */}
      <div
        className="flex items-center justify-center px-2 py-4 sm:px-4 sm:py-8"
        style={{
          backgroundColor: "#0b0f17",
          backgroundImage: "radial-gradient(rgba(255,255,255,.09) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const features = [
  { emoji: "🌳", title: "Workspace tree view", desc: "See the whole team's work as a map — who's assigned what and what everyone is doing, all in one view." },
  { emoji: "😄", title: "Daily mood check-in", desc: "Members log their mood daily so leaders instantly spot who's stuck and can step in on time." },
  { emoji: "🤖", title: "AI work summaries", desc: "Let Gemini summarize your team's work and mood — download or print the report." },
];

/* ---------- aurora background (dark landing theme) ---------- */

// ก้อนไล่สีเบลอบาง ๆ — คุมให้เหลือ 3 ก้อน โทนน้ำเงิน/คราม ตัดด้วยเขียวแบรนด์นิดเดียว
// (เวอร์ชันก่อนใช้ 5 ก้อน 5 สีจนดูฉูดฉาด — ลด opacity ลงราวครึ่งหนึ่งและเบลอหนักขึ้น)
function AuroraBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* ฐานไล่สีเกือบดำ ให้ความรู้สึกลึกแทนความจัด */}
      <div className="absolute inset-0 bg-[radial-gradient(115%_75%_at_50%_-10%,#131a2e_0%,#0a0e1a_50%,#070a12_100%)]" />

      <div className="animate-aurora absolute -left-[12%] top-[2%] h-[36rem] w-[36rem] rounded-full bg-[#2f4fa8] opacity-[0.18] blur-[150px]" />
      <div className="animate-aurora absolute -right-[10%] top-[10%] h-[32rem] w-[32rem] rounded-full bg-[#2e9e5b] opacity-[0.13] blur-[160px]" style={{ animationDelay: "-9s" }} />
      <div className="animate-aurora absolute bottom-[6%] left-[26%] h-[30rem] w-[30rem] rounded-full bg-[#5b4bc4] opacity-[0.15] blur-[160px]" style={{ animationDelay: "-17s" }} />

      {/* เส้นตารางจาง ๆ ให้พื้นหลังมีเท็กซ์เจอร์แทนการเพิ่มสี */}
      <div className="absolute inset-0 opacity-[0.35] bg-[linear-gradient(rgba(255,255,255,.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.028)_1px,transparent_1px)] bg-[size:56px_56px]" />

      {/* ฟิล์มมืดด้านล่าง ให้กลืนกับ section ถัดไป */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-[#070a12]" />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#070a12] text-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070a12]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="font-heading text-lg font-bold text-white">Task<span style={{ color: "#6fcf97" }}>Hub</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <a href="#demo" className="hidden rounded-lg px-3.5 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:block">
              Try it
            </a>
            <a href="#features" className="hidden rounded-lg px-3.5 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:block">
              Features
            </a>
            <Link
              href="/login"
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — dark aurora gradient */}
      <section className="relative flex-1 overflow-hidden px-5 pb-4 pt-16 sm:pt-24">
        <AuroraBackdrop />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/85 shadow-sm backdrop-blur">
            ✨ Track your team's tasks + mood in one place
          </span>
          <h1 className="animate-fade-up mt-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl" style={{ animationDelay: "80ms" }}>
            Manage team work<br />and stay <span className="text-aurora">productive</span>
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/65" style={{ animationDelay: "160ms" }}>
            Assign tasks, track progress, and look after your team's mood — all in one place.
            Perfect for work teams, teachers &amp; students, or a group of friends.
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "240ms" }}>
            <Link
              href="/login"
              className="group rounded-xl bg-brand px-7 py-3 text-sm font-bold text-white shadow-[0_12px_30px_-12px_rgba(46,158,91,.9)] transition-transform hover:-translate-y-0.5 hover:bg-[#35b268]"
            >
              Get started free <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a href="#demo" className="rounded-xl border border-white/20 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10">
              Try the demo
            </a>
          </div>
        </div>

        {/* product shot */}
        <div className="relative z-10 mx-auto mt-14 max-w-3xl px-1">
          <Reveal>
            <WindowFrame>
              <TreePreview />
            </WindowFrame>
          </Reveal>
        </div>
      </section>

      {/* Try it — สาธิตฟีเจอร์จริง กดเล่นได้ ไม่แตะฐานข้อมูล */}
      <section id="demo" className="relative overflow-hidden border-t border-white/10 bg-[#070a12]">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-[10%] h-72 w-[42rem] -translate-x-1/2 rounded-full bg-[#5b4bc4] opacity-[0.12] blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-5 py-20">
          <Reveal className="mx-auto mb-10 max-w-lg text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-white/60">
              Try it right here
            </span>
            <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Have a play before you sign up
            </h2>
            <p className="mt-2 text-white/55">
              Move tasks, check in your mood, generate a summary — all live, no account needed.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <LiveDemo />
          </Reveal>
        </div>
      </section>

      {/* Features — glass cards */}
      <section id="features" className="relative overflow-hidden border-t border-white/10 bg-[#070a12]">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute bottom-0 right-[10%] h-56 w-[28rem] rounded-full bg-[#2e9e5b] opacity-[0.1] blur-[130px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-5 py-20">
          <Reveal className="mx-auto mb-12 max-w-lg text-center">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">Everything your team needs</h2>
            <p className="mt-2 text-white/60">Designed to give you your whole team at a glance.</p>
          </Reveal>
          <div className="grid gap-8 sm:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 120}>
                <div className="ring-gradient group flex h-full flex-col items-center rounded-2xl border border-white/10 bg-white/[0.04] p-7 text-center backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.07] hover:shadow-[0_20px_50px_-20px_rgba(56,189,248,.45)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white/15 to-white/5 text-2xl ring-1 ring-white/15 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">{f.emoji}</div>
                  <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — แผงกระจกบนพื้นเข้ม แทนแถบไล่สีจัด ๆ แบบเดิม */}
      <section className="relative overflow-hidden border-t border-white/10 bg-[#070a12] px-5 py-20">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-64 w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2f4fa8] opacity-[0.16] blur-[130px]" />
        </div>
        <Reveal className="ring-gradient relative mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-14 text-center backdrop-blur-xl">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">Ready to make your team more productive?</h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">Start free today — just log in with Google.</p>
          <Link
            href="/login"
            className="group mt-7 inline-block rounded-xl border border-white/15 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            Get started free <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#070a12]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-white/55 sm:flex-row">
          <span className="font-semibold text-white/70">Task<span style={{ color: "#6fcf97" }}>Hub</span></span>
          <span>© 2026 TaskHub · Capstone Project</span>
        </div>
      </footer>
    </div>
  );
}
