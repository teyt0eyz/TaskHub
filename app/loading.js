export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-soft border-t-brand" />
        <p className="text-sm font-medium text-ink-3">กำลังโหลด...</p>
      </div>
    </div>
  );
}
