"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { moods } from "@/lib/mockData";

const moodOrder = ["great", "good", "okay", "stressed", "blocked"];

function Field({ label, hint, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      {hint && <p className="mb-2 text-xs text-ink-3">{hint}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-brand focus:ring-2 focus:ring-brand-soft"
      />
    </div>
  );
}

export default function CheckinPage() {
  const { projectId } = useParams();
  const backHref = `/member/${projectId}`;
  const [mood, setMood] = useState("good");
  const [done, setDone] = useState("");
  const [blockers, setBlockers] = useState("");
  const [plan, setPlan] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          mood,
          done_today: done,
          blockers,
          plan_tomorrow: plan,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "failed");
      }
      setSubmitted(true);
    } catch (e) {
      setError("Save failed: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-up rounded-2xl border border-line bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,.06)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-3xl">
            🎉
          </div>
          <h2 className="text-xl font-bold text-ink">Checked in!</h2>
          <p className="mt-1.5 text-sm text-ink-2">
            Today's mood: {moods[mood].emoji} {moods[mood].label}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => setSubmitted(false)}
              className="rounded-[10px] border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-surface-2"
            >
              Edit
            </button>
            <Link
              href={backHref}
              className="rounded-[10px] bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Back to tasks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h1 className="text-xl font-bold tracking-tight text-ink">Daily check-in</h1>
          <p className="mt-0.5 text-sm text-ink-2">Log your progress and mood for today</p>
        </div>

        <div className="space-y-6 rounded-2xl border border-line bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.05)]">
          {/* Mood selector */}
          <div>
            <label className="mb-2.5 block text-sm font-semibold text-ink">How are you feeling today?</label>
            <div className="flex flex-wrap gap-2.5">
              {moodOrder.map((key) => {
                const m = moods[key];
                const active = mood === key;
                return (
                  <button
                    key={key}
                    onClick={() => setMood(key)}
                    className="flex flex-col items-center gap-1 rounded-xl border px-4 py-3 transition-all"
                    style={{
                      borderColor: active ? m.color : "#E4E4E4",
                      background: active ? m.bg : "#fff",
                      transform: active ? "translateY(-2px)" : "none",
                    }}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: active ? m.color : "#9A9A9A" }}
                    >
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-line-soft" />

          <Field
            label="What did you get done today?"
            value={done}
            onChange={setDone}
            placeholder="e.g. Landing page design 80% done..."
          />
          <Field
            label="Any blockers?"
            hint="If you pick 'Stuck', the leader is alerted immediately"
            value={blockers}
            onChange={setBlockers}
            placeholder="e.g. Waiting on the backend team’s API..."
          />
          <Field
            label="What’s your plan for tomorrow?"
            value={plan}
            onChange={setPlan}
            placeholder="e.g. Build the dashboard and connect the API..."
          />

          {error && (
            <div className="rounded-lg bg-[rgba(193,57,43,.08)] p-3 text-sm text-[#c1392b]">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <Link
              href={backHref}
              className="rounded-[10px] border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-surface-2"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={busy}
              className="rounded-[10px] bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(46,158,91,.3)] hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save check-in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
