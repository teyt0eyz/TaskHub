"use client";

// เลือกภาษาผลลัพธ์ของ AI summary (ไทย / อังกฤษ)
export default function SummaryLangToggle({ value, onChange }) {
  const opts = [
    { key: "th", label: "ไทย" },
    { key: "en", label: "EN" },
  ];
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-[11px] font-medium text-ink-3">Language</span>
      <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
        {opts.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              value === o.key ? "bg-brand text-white" : "text-ink-2 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
