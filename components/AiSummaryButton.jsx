"use client";

import { useEffect, useMemo, useState } from "react";
import Markdown from "@/components/Markdown";
import GeminiKeyField, { readGeminiKey } from "@/components/GeminiKeyField";

const MAX_HISTORY = 12;

export default function AiSummaryButton({ projectId, memberId, memberName }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); // [{ id, summary, at }] ใหม่สุดอยู่บน
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(null);
  const [limit, setLimit] = useState(4);
  const [hasKey, setHasKey] = useState(false);

  const current = useMemo(() => history.find((h) => h.id === selectedId) || history[0] || null, [history, selectedId]);

  useEffect(() => {
    // โหลดประวัติ + โควตาจากเซิร์ฟเวอร์ (no-store: กันเบราว์เซอร์ cache ค่าโควตาเก่าตอนกลับเข้าหน้าใหม่)
    fetch(`/api/ai/summary?projectId=${projectId}&memberId=${memberId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setRemaining(d.remaining);
        setLimit(d.limit || 4);
        if (Array.isArray(d.history)) {
          setHistory(d.history);
          setSelectedId(d.history[0]?.id || null);
        }
      })
      .catch(() => {});
    setHasKey(!!readGeminiKey());

    const onQuota = (e) => {
      if (typeof e.detail?.remaining === "number") setRemaining(e.detail.remaining);
    };
    const onKey = () => setHasKey(!!readGeminiKey());
    window.addEventListener("taskhub:ai-quota", onQuota);
    window.addEventListener("taskhub:gemini-key", onKey);
    return () => {
      window.removeEventListener("taskhub:ai-quota", onQuota);
      window.removeEventListener("taskhub:gemini-key", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, memberId]);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, userId: memberId, memberName, apiKey: readGeminiKey() || undefined }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setRemaining(0);
        window.dispatchEvent(new CustomEvent("taskhub:ai-quota", { detail: { remaining: 0 } }));
        throw new Error("โปรเจกต์นี้ใช้ครบ 4 ครั้งเดือนนี้แล้ว — ใส่ API key ของคุณเองด้านล่างเพื่อ gen ต่อได้ไม่จำกัด");
      }
      if (!res.ok) throw new Error(data.detail || data.error || "failed");

      const entry = data.entry || { id: new Date().toISOString(), summary: data.summary || "", at: new Date().toISOString() };
      setHistory((prev) => [entry, ...prev.filter((h) => h.id !== entry.id)].slice(0, MAX_HISTORY));
      setSelectedId(entry.id);
      if (typeof data.remaining === "number") {
        setRemaining(data.remaining);
        window.dispatchEvent(new CustomEvent("taskhub:ai-quota", { detail: { remaining: data.remaining } }));
      }
    } catch (e) {
      setError("สรุปไม่สำเร็จ: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCurrent() {
    if (!current) return;
    if (!confirm("ลบสรุปฉบับนี้ออกจากประวัติ?")) return;
    const id = current.id;
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      setSelectedId(next[0]?.id || null);
      return next;
    });
    try {
      await fetch("/api/ai/summary", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, projectId }),
      });
    } catch {}
  }

  const fmtDate = (iso) => new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  const fmtShort = (iso) => new Date(iso).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const stripMd = (s) => String(s).replace(/^#{1,6}\s+/gm, "").replace(/\*\*([^*]+)\*\*/g, "$1");
  function fileBase() {
    const d = current ? current.at.slice(0, 10) : new Date().toISOString().slice(0, 10);
    return `TaskHub-สรุป-${(memberName || "member").replace(/\s+/g, "_")}-${d}`;
  }
  function downloadTxt() {
    if (!current) return;
    const header = `สรุปรายคน — ${memberName}\nวันที่ ${fmtDate(current.at)}\n\n`;
    const blob = new Blob([header + stripMd(current.summary)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileBase() + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportPdf() {
    if (!current) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    w.document.write(
      `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(fileBase())}</title>
      <style>
        body{font-family:'Noto Sans Thai','Sarabun',system-ui,sans-serif;color:#1c1c1c;padding:40px;max-width:720px;margin:auto;line-height:1.75}
        h1{font-size:20px;margin:0 0 4px}
        .meta{color:#8a8a8a;font-size:13px;margin-bottom:22px;border-bottom:1px solid #eee;padding-bottom:14px}
        pre{white-space:pre-wrap;font-family:inherit;font-size:14px;margin:0}
        .brand{color:#2E9E5B;font-weight:700}
      </style></head><body>
      <h1><span class="brand">TaskHub</span> · สรุปรายคน ${esc(memberName)}</h1>
      <div class="meta">สรุปโดย AI (Gemini) · ${esc(fmtDate(current.at))}</div>
      <pre>${esc(stripMd(current.summary))}</pre>
      <script>window.onload=function(){setTimeout(function(){window.print();},350);}<\/script>
      </body></html>`
    );
    w.document.close();
  }

  const out = !hasKey && remaining === 0;
  const quotaText = hasKey ? "ไม่จำกัด 🔑" : remaining !== null ? `เหลือ ${remaining}/${limit}` : "";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative mt-4 w-full rounded-[10px] border border-brand bg-brand-soft px-3 py-2 text-[13px] font-semibold text-brand-dark hover:bg-brand/15"
      >
        🤖 สรุปด้วย AI
        {quotaText && <span className="ml-1 font-normal text-ink-3">({quotaText})</span>}
        {history.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {history.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-ink">สรุปสัปดาห์ — {memberName}</h2>
                {current && <p className="mt-0.5 text-xs text-ink-3">สรุปเมื่อ {fmtDate(current.at)}{current.by ? ` · โดย ${current.by}` : ""}</p>}
              </div>
              <button onClick={() => setOpen(false)} className="text-ink-3 hover:text-ink">✕</button>
            </div>

            <div className="border-b border-line bg-brand-soft/40 px-5 py-1.5 text-[11px] text-ink-3">
              💾 เก็บในระบบ (ล่าสุด {MAX_HISTORY} ฉบับ) · หัวหน้าและรองหัวหน้าเห็นประวัติร่วมกัน
            </div>

            {history.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto border-b border-line bg-surface-2/40 px-5 py-2">
                <span className="shrink-0 text-[11px] font-semibold text-ink-3">ประวัติ:</span>
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedId(h.id)}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      current?.id === h.id ? "bg-brand text-white" : "bg-white text-ink-2 ring-1 ring-line hover:bg-surface-2"
                    }`}
                  >
                    {fmtShort(h.at)}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="py-12 text-center text-sm text-ink-2">⏳ กำลังให้ Gemini สรุป...</div>
              ) : current ? (
                <Markdown text={current.summary} />
              ) : (
                <div className="py-10 text-center">
                  <p className="text-sm text-ink-2">สรุปผลงานและ mood สัปดาห์นี้ของ {memberName} ด้วย AI</p>
                  <button
                    onClick={generate}
                    disabled={out}
                    className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(46,158,91,.3)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ▶ เริ่มสรุป
                  </button>
                  <div className="mt-2 text-xs text-ink-3">
                    {hasKey ? "ใช้ API key ของคุณเอง — ไม่จำกัด 🔑" : `โควตาโปรเจกต์เหลือ ${remaining ?? "-"}/${limit} ครั้งเดือนนี้`}
                  </div>
                </div>
              )}
              {error && <div className="mt-3 rounded-lg bg-[rgba(193,57,43,.08)] p-3 text-sm text-[#c1392b]">{error}</div>}
              <div className="mt-4">
                <GeminiKeyField />
              </div>
            </div>

            {current && !loading && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={generate}
                    disabled={out}
                    className="rounded-[10px] border border-brand px-3 py-2 text-sm font-semibold text-brand-dark hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ➕ สรุปใหม่
                  </button>
                  <button onClick={deleteCurrent} className="rounded-[10px] border border-line px-3 py-2 text-sm font-semibold text-[#c1392b] hover:bg-[rgba(193,57,43,.06)]">
                    🗑 ลบฉบับนี้
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadTxt} className="rounded-[10px] border border-line px-3.5 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2">
                    ⬇ ดาวน์โหลด .txt
                  </button>
                  <button onClick={exportPdf} className="rounded-[10px] bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                    📄 บันทึก PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
