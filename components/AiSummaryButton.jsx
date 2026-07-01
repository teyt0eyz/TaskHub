"use client";

import { useEffect, useState } from "react";

export default function AiSummaryButton({ projectId, memberId, memberName }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(null); // null = ยังไม่รู้
  const [limit, setLimit] = useState(5);

  // โหลดโควตาที่เหลือของผู้ใช้ปัจจุบัน
  useEffect(() => {
    fetch("/api/ai/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setRemaining(d.remaining);
          setLimit(d.limit || 5);
        }
      })
      .catch(() => {});
  }, []);

  async function run() {
    setOpen(true);
    setLoading(true);
    setError("");
    setSummary("");
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, userId: memberId, memberName }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setRemaining(0);
        throw new Error("ใช้ครบโควตาเดือนนี้แล้ว รีเซ็ตวันที่ 1 เดือนหน้า");
      }
      if (!res.ok) throw new Error(data.error || "failed");
      setSummary(data.summary || "(ไม่มีผลลัพธ์)");
      if (typeof data.remaining === "number") setRemaining(data.remaining);
    } catch (e) {
      setError("สรุปไม่สำเร็จ: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const out = remaining === 0;

  return (
    <>
      <button
        onClick={run}
        disabled={out}
        title={out ? "ใช้ครบโควตาเดือนนี้แล้ว" : "สรุปด้วย AI"}
        className="mt-4 w-full rounded-[10px] border border-brand bg-brand-soft px-3 py-2 text-[13px] font-semibold text-brand-dark hover:bg-brand/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        🤖 สรุปสัปดาห์นี้ด้วย AI
        {remaining !== null && <span className="ml-1 font-normal text-ink-3">(เหลือ {remaining}/{limit})</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-line bg-white p-6 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">สรุปสัปดาห์ — {memberName}</h2>
              <button onClick={() => setOpen(false)} className="text-ink-3 hover:text-ink">
                ✕
              </button>
            </div>
            {loading && <div className="py-8 text-center text-sm text-ink-2">⏳ กำลังให้ Gemini สรุป...</div>}
            {error && <div className="rounded-lg bg-[rgba(193,57,43,.08)] p-3 text-sm text-[#c1392b]">{error}</div>}
            {summary && (
              <>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{summary}</div>
                {remaining !== null && (
                  <div className="mt-4 text-right text-xs text-ink-3">โควตาที่เหลือเดือนนี้: {remaining}/{limit} ครั้ง</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
