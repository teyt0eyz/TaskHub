import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,.06)]">
        <div className="mb-2 text-5xl font-black text-brand">404</div>
        <h2 className="text-lg font-bold text-ink">ไม่พบหน้าที่คุณต้องการ</h2>
        <p className="mt-1.5 text-sm text-ink-2">หน้านี้อาจถูกย้าย ลบ หรือลิงก์ไม่ถูกต้อง</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-[10px] bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
