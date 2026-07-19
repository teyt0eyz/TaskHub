"use client";

import { useEffect, useRef, useState } from "react";

/*
 * สาธิตฟีเจอร์จริงบนหน้าแรก — กดเล่นได้ทุกอัน แต่เป็น state ใน React ล้วน
 * ไม่มี fetch / ไม่แตะ Supabase เพราะหน้านี้เปิดได้โดยยังไม่ล็อกอิน
 * สีใช้ค่าตายตัว (ไม่ใช้ token ธีม) เพราะ landing เป็นธีมมืดเสมอ
 */

const TABS = [
  { key: "tasks", label: "Task board", icon: "📋" },
  { key: "checkin", label: "Mood check-in", icon: "😄" },
  { key: "summary", label: "AI summary", icon: "🤖" },
  { key: "calendar", label: "Calendar", icon: "🗓" },
];

const CYCLE = ["todo", "in_progress", "done"];
const STATUS = {
  todo: { label: "Todo", dot: "#8b95a4", chip: "bg-white/10 text-white/70" },
  in_progress: { label: "In Progress", dot: "#ff8b5c", chip: "bg-[#ff8b5c]/15 text-[#ffab87]" },
  done: { label: "Done ✓", dot: "#4ade80", chip: "bg-[#4ade80]/15 text-[#86efac]" },
};

const SEED = [
  { id: 1, title: "Design landing page", who: "Mira", tag: "Design", status: "in_progress", due: "Jul 3" },
  { id: 2, title: "Write API docs", who: "Theo", tag: "Docs", status: "todo", due: "Jul 5" },
  { id: 3, title: "Set up Supabase schema", who: "Theo", tag: "Backend", status: "done", due: "Jul 6" },
  { id: 4, title: "Fix login bug", who: "Sora", tag: "Bug", status: "todo", due: "Jul 2" },
];

/* ---------- 1. task board ---------- */

function TasksDemo() {
  const [tasks, setTasks] = useState(SEED);
  const [bumped, setBumped] = useState(null);

  function advance(id) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: CYCLE[(CYCLE.indexOf(t.status) + 1) % CYCLE.length] } : t
      )
    );
    setBumped(id);
    setTimeout(() => setBumped((b) => (b === id ? null : b)), 350);
  }

  const done = tasks.filter((t) => t.status === "done").length;
  const pct = Math.round((done / tasks.length) * 100);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2e9e5b] to-[#4ade80] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold text-white/60">
          {done}/{tasks.length} done
        </span>
      </div>

      <p className="mb-3 text-xs text-white/55">Tap a card to move it forward →</p>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {tasks.map((t) => {
          const st = STATUS[t.status];
          return (
            <button
              key={t.id}
              onClick={() => advance(t.id)}
              className={`group rounded-xl border border-white/10 bg-white/[0.04] p-3.5 text-left transition-all hover:border-white/25 hover:bg-white/[0.08] ${
                bumped === t.id ? "scale-[1.03]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`text-sm font-medium leading-snug ${
                    t.status === "done" ? "text-white/50 line-through" : "text-white/90"
                  }`}
                >
                  {t.title}
                </span>
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: st.dot }} />
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.chip}`}>
                  {st.label}
                </span>
                <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] text-white/55">
                  {t.tag}
                </span>
                <span className="ml-auto text-[10px] text-white/55">🗓 {t.due}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 2. mood check-in ---------- */

const MOODS = [
  { key: "great", emoji: "😄", label: "Great", color: "#6fcf97" },
  { key: "good", emoji: "🙂", label: "Good", color: "#7fb3f0" },
  { key: "okay", emoji: "😐", label: "Okay", color: "#f0cf4a" },
  { key: "stressed", emoji: "😣", label: "Stressed", color: "#ffa06b" },
  { key: "blocked", emoji: "🚧", label: "Stuck", color: "#ff7a6b" },
];

function CheckinDemo() {
  const [mood, setMood] = useState(null);
  const [blocker, setBlocker] = useState(false);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const picked = MOODS.find((m) => m.key === mood);

  return (
    <div>
      <p className="mb-3 text-sm text-white/60">How is work going today?</p>

      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => {
          const on = mood === m.key;
          return (
            <button
              key={m.key}
              onClick={() => {
                setMood(m.key);
                setSaved(false);
              }}
              className={`flex flex-col items-center gap-1 rounded-xl border px-4 py-3 transition-all ${
                on ? "-translate-y-0.5 border-white/30 bg-white/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: on ? m.color : "rgba(255,255,255,.6)" }}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2.5">
        <button
          type="button"
          role="switch"
          aria-checked={blocker}
          onClick={() => {
            setBlocker((v) => !v);
            setSaved(false);
          }}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
            blocker ? "bg-[#ff7a6b]" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              blocker ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </button>
        <span className="text-sm text-white/70" onClick={() => setBlocker((v) => !v)}>
          I'm blocked on something
        </span>
      </label>

      <input
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        placeholder="Add a note for your leader (optional)"
        className="mt-3 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
      />

      <button
        onClick={() => setSaved(true)}
        disabled={!mood}
        className="mt-3 w-full rounded-xl bg-white/95 py-2.5 text-sm font-bold text-[#0b1020] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {saved ? "Checked in ✓" : "Check in"}
      </button>

      {saved && picked && (
        <div className="animate-fade-up mt-3 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3">
          <span className="text-xl">{picked.emoji}</span>
          <div className="text-sm">
            <span className="font-semibold" style={{ color: picked.color }}>
              {picked.label}
            </span>
            <span className="text-white/50">
              {blocker ? " · flagged as blocked" : " · no blockers"}
            </span>
          </div>
          <span className="ml-auto rounded-full bg-[#f5c400]/15 px-2.5 py-1 text-[11px] font-bold text-[#f0cf4a]">
            🔥 5-day streak
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------- 3. AI summary ---------- */

const SUMMARY = `Team shipped 3 of 4 tasks this week — momentum is good.

• Theo finished the Supabase schema ahead of the deadline.
• Mira is mid-way through the landing page and on track for Jul 3.
• Sora flagged a blocker on the login bug two days running.

Watch out: the login bug is the only overdue item and it is blocking
the release. Worth a quick check-in with Sora tomorrow.`;

function SummaryDemo() {
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [quota, setQuota] = useState(5);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  function generate() {
    if (running || quota === 0) return;
    setRunning(true);
    setText("");
    setQuota((q) => q - 1);
    let i = 0;
    timer.current = setInterval(() => {
      i += 3;
      setText(SUMMARY.slice(0, i));
      if (i >= SUMMARY.length) {
        clearInterval(timer.current);
        setRunning(false);
      }
    }, 16);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm text-white/60">Monthly summary by Gemini</span>
        <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[11px] font-semibold text-white/60">
          {quota} of 5 left this month
        </span>
      </div>

      <button
        onClick={generate}
        disabled={running || quota === 0}
        className="w-full rounded-xl bg-gradient-to-r from-[#6b3fa0] to-[#4f46e5] py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {quota === 0 ? "Quota used up — resets on the 1st" : running ? "Generating…" : "✨ Generate summary"}
      </button>

      <div className="mt-3 min-h-[9.5rem] rounded-xl border border-white/10 bg-black/25 p-4">
        {text ? (
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-white/75">
            {text}
            {running && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-white/60 align-middle" />}
          </pre>
        ) : (
          <p className="text-[13px] text-white/45">
            The summary of your team's work and mood will appear here.
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- 4. calendar ---------- */

const BY_DAY = {
  2: [{ t: "Fix login bug", s: "todo", late: true }],
  3: [{ t: "Design landing page", s: "in_progress" }],
  5: [{ t: "Write API docs", s: "todo" }],
  6: [{ t: "Set up Supabase schema", s: "done" }],
  9: [{ t: "Deploy to Vercel", s: "todo" }],
};

function CalendarDemo() {
  const [day, setDay] = useState(3);
  const items = BY_DAY[day] || [];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-white/80">July 2026</span>
        <span className="text-xs text-white/55">Tap a date</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="pb-1 text-[10px] font-semibold text-white/50">
            {d}
          </span>
        ))}
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
          const has = BY_DAY[d];
          const on = day === d;
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`relative aspect-square rounded-lg text-xs transition-colors ${
                on
                  ? "bg-white/90 font-bold text-[#0b1020]"
                  : has
                  ? "bg-white/[0.07] text-white/80 hover:bg-white/15"
                  : "text-white/50 hover:bg-white/[0.06]"
              }`}
            >
              {d}
              {has && !on && (
                <span
                  className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                  style={{ background: has[0].late ? "#ff7a6b" : STATUS[has[0].s].dot }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 min-h-[4.5rem] rounded-xl border border-white/10 bg-white/[0.04] p-3">
        {items.length === 0 ? (
          <p className="text-[13px] text-white/50">Nothing due on July {day}.</p>
        ) : (
          items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: it.late ? "#ff7a6b" : STATUS[it.s].dot }}
              />
              <span className={`text-[13px] ${it.s === "done" ? "text-white/55 line-through" : "text-white/80"}`}>
                {it.t}
              </span>
              {it.late && (
                <span className="ml-auto rounded-full bg-[#ff7a6b]/15 px-2 py-0.5 text-[10px] font-semibold text-[#ff9d92]">
                  Overdue
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------- shell ---------- */

const PANELS = { tasks: TasksDemo, checkin: CheckinDemo, summary: SummaryDemo, calendar: CalendarDemo };

export default function LiveDemo() {
  const [tab, setTab] = useState("tasks");
  const Panel = PANELS[tab];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap justify-center gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors ${
              tab === t.key
                ? "bg-white/[0.12] text-white ring-1 ring-white/20"
                : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6">
        <Panel />
      </div>

      <p className="mt-3 text-center text-xs text-white/50">
        Fully interactive preview — nothing here is saved.
      </p>
    </div>
  );
}
