export default function Loading() {
  return (
    <div className="dot-grid flex h-full flex-col items-center justify-center gap-5">
      <div className="h-[92px] w-[200px] animate-pulse rounded-[14px] border-2 border-brand-soft bg-white" />
      <div className="h-6 w-px bg-line" />
      <div className="flex gap-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-4">
            <div className="h-[78px] w-[200px] animate-pulse rounded-[14px] border-2 border-line bg-white" style={{ animationDelay: `${i * 120}ms` }} />
            <div className="h-[140px] w-[200px] animate-pulse rounded-2xl border border-line bg-white/70" style={{ animationDelay: `${i * 120 + 80}ms` }} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm font-medium text-ink-3">กำลังโหลด workspace...</p>
    </div>
  );
}
