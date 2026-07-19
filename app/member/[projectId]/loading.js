export default function Loading() {
  return (
    <div className="dot-grid flex h-full flex-col items-center justify-center gap-4">
      <div className="h-[92px] w-[200px] animate-pulse rounded-[14px] border-2 border-accent/40 bg-surface" />
      <div className="h-6 w-px bg-line" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[140px] w-[220px] animate-pulse rounded-2xl border border-line bg-surface/70"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
      <p className="mt-2 text-sm font-medium text-ink-3">Loading your tasks...</p>
    </div>
  );
}
