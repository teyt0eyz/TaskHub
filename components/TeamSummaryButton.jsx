"use client";

import { useEffect, useMemo, useState } from "react";
import Markdown from "@/components/Markdown";
import GeminiKeyField, { readGeminiKey } from "@/components/GeminiKeyField";
import SummaryLangToggle from "@/components/SummaryLangToggle";
import TrashIcon from "@/components/icons/TrashIcon";

const MAX_HISTORY = 12;

export default function TeamSummaryButton({ projectId }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); // [{ id, summary, projectName, at }] ใหม่สุดอยู่บน
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(null);
  const [limit, setLimit] = useState(4);
  const [hasKey, setHasKey] = useState(false);
  const [lang, setLang] = useState("en");

  function changeLang(l) {
    setLang(l);
    try {
      localStorage.setItem("taskhub:ai-lang", l);
    } catch {}
  }

  const current = useMemo(
    () => history.find((h) => h.id === selectedId) || history[0] || null,
    [history, selectedId]
  );

  // โหลดโควตา + ประวัติTeam summary (จากระบบ — แชร์กันในทีมผู้จัดการ) + ฟังการอัปเดตจากปุ่มอื่น
  useEffect(() => {
    fetch(`/api/ai/summary?projectId=${projectId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setRemaining(d.remaining);
        setLimit(d.limit || 4);
      })
      .catch(() => {});
    fetch(`/api/ai/team-summary?projectId=${projectId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.history)) {
          setHistory(d.history);
          setSelectedId(d.history[0]?.id || null);
        }
      })
      .catch(() => {});
    setHasKey(!!readGeminiKey());
    try {
      const saved = localStorage.getItem("taskhub:ai-lang");
      if (saved === "th" || saved === "en") setLang(saved);
    } catch {}

    const onQuota = (e) => {
      if (typeof e.detail?.remaining === "number") setRemaining(e.detail.remaining);
      if (e.detail?.limit) setLimit(e.detail.limit);
    };
    const onKey = () => setHasKey(!!readGeminiKey());
    window.addEventListener("taskhub:ai-quota", onQuota);
    window.addEventListener("taskhub:gemini-key", onKey);
    return () => {
      window.removeEventListener("taskhub:ai-quota", onQuota);
      window.removeEventListener("taskhub:gemini-key", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function broadcastQuota(remaining, limit) {
    window.dispatchEvent(new CustomEvent("taskhub:ai-quota", { detail: { remaining, limit } }));
  }

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/team-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, lang, apiKey: readGeminiKey() || undefined }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setRemaining(0);
        broadcastQuota(0, data.limit || limit);
        throw new Error("This project has used all 4 credits this month — add your own API key below to keep generating unlimited");
      }
      if (!res.ok)
        throw new Error(data.error === "no_members" ? "No team members yet" : data.detail || data.error || "failed");

      const entry = data.entry || {
        id: new Date().toISOString(),
        summary: data.summary || "",
        projectName: data.projectName || "",
        at: new Date().toISOString(),
      };
      // เพิ่มเข้าประวัติ (ไม่ทับของเก่า) จำกัดไว้ล่าสุด MAX_HISTORY อัน
      setHistory((prev) => [entry, ...prev.filter((h) => h.id !== entry.id)].slice(0, MAX_HISTORY));
      setSelectedId(entry.id);
      if (typeof data.remaining === "number") {
        setRemaining(data.remaining);
        broadcastQuota(data.remaining, data.limit || limit);
      }
    } catch (e) {
      setError("Summary failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCurrent() {
    if (!current) return;
    if (!confirm("Delete this summary from history?")) return;
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

  function fileBase() {
    const d = current ? current.at.slice(0, 10) : new Date().toISOString().slice(0, 10);
    return `TaskHub-summary-${(current?.projectName || "team").replace(/\s+/g, "_")}-${d}`;
  }
  const stripMd = (s) => String(s).replace(/^#{1,6}\s+/gm, "").replace(/\*\*([^*]+)\*\*/g, "$1");

  function downloadTxt() {
    if (!current) return;
    const header = `Team summary — ${current.projectName}\nDate ${fmtDate(current.at)}\n\n`;
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
      <h1><span class="brand">TaskHub</span> · Team summary ${esc(current.projectName)}</h1>
      <div class="meta">Summarized by AI (Gemini) · ${esc(fmtDate(current.at))}</div>
      <pre>${esc(stripMd(current.summary))}</pre>
      <script>window.onload=function(){setTimeout(function(){window.print();},350);}<\/script>
      </body></html>`
    );
    w.document.close();
  }

  const out = !hasKey && remaining === 0;
  const quotaText = hasKey ? "Unlimited 🔑" : remaining !== null ? `${remaining}/${limit} left` : "";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Summarize the whole team with AI"
        className="relative flex items-center gap-2 rounded-[10px] bg-[#6b3fa0] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(107,63,160,.3)] transition-transform hover:-translate-y-0.5"
      >
        🤖 Summarize whole team with AI
        {quotaText && <span className="font-normal opacity-80">({quotaText})</span>}
        {history.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold ring-2 ring-surface" title={`summaries saved ${history.length}`}>
            {history.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-ink">
                  Team AI summary {current?.projectName && `— ${current.projectName}`}
                </h2>
                {current && (
                  <p className="mt-0.5 text-xs text-ink-3">
                    Summarized {fmtDate(current.at)}{current.by ? ` · by ${current.by}` : ""}
                  </p>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="text-ink-3 hover:text-ink">✕</button>
            </div>

            {/* แจ้งนโยบายการเก็บ */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-brand-soft/40 px-5 py-1.5 text-[11px] text-ink-3">
              <span>💾 Stored in the system · shared by leaders and deputies</span>
              <SummaryLangToggle value={lang} onChange={changeLang} />
            </div>

            {/* แถบประวัติ — เลือกดูย้อนหลังได้ (ไม่ทับกันเมื่อNew summary) */}
            {history.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto border-b border-line bg-surface-2/40 px-5 py-2">
                <span className="shrink-0 text-[11px] font-semibold text-ink-3">History:</span>
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedId(h.id)}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      current?.id === h.id ? "bg-[#6b3fa0] text-white" : "bg-surface text-ink-2 ring-1 ring-line hover:bg-surface-2"
                    }`}
                  >
                    {fmtShort(h.at)}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="py-12 text-center text-sm text-ink-2">⏳ Gemini is reading everyone’s data and summarizing...</div>
              ) : current ? (
                <Markdown text={current.summary} />
              ) : (
                <div className="py-10 text-center">
                  <p className="text-sm text-ink-2">Pulls every member’s check-ins and tasks for the AI to summarize by name</p>
                  <button
                    onClick={generate}
                    disabled={out}
                    className="mt-4 rounded-xl bg-[#6b3fa0] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(107,63,160,.3)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ▶ Summarize whole team (uses 1 credit)
                  </button>
                  <div className="mt-2 text-xs text-ink-3">
                    {hasKey ? "Using your own API key — unlimited 🔑" : `Project credits left ${remaining ?? "-"}/${limit} this month`}
                  </div>
                  {out && <div className="mt-1 text-xs text-danger">Project credits used up — add your own API key below to keep generating</div>}
                </div>
              )}
              {error && <div className="mt-3 rounded-lg bg-danger-soft p-3 text-sm text-danger">{error}</div>}
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
                    title={out ? "Out of credits" : "Create a new summary (added to history, never overwrites)"}
                    className="rounded-[10px] border border-deputy px-3 py-2 text-sm font-semibold text-deputy hover:bg-deputy/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ➕ New summary
                  </button>
                  <button onClick={deleteCurrent} className="inline-flex items-center gap-1.5 rounded-[10px] border border-line px-3 py-2 text-sm font-semibold text-danger hover:bg-danger-soft">
                    <TrashIcon size={15} /> Delete this one
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadTxt} className="rounded-[10px] border border-line px-3.5 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2">
                    ⬇ Download .txt
                  </button>
                  <button onClick={exportPdf} className="rounded-[10px] bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                    📄 Save PDF
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
