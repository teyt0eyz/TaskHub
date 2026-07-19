"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

function timeAgo(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)} min ago`;
  if (d < 86400) return `${Math.floor(d / 3600)} h ago`;
  return `${Math.floor(d / 86400)} d ago`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState(null); // { message } — push toast บนสุด
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  const userIdRef = useRef(null);
  const itemsRef = useRef([]);
  const toastTimers = useRef([]);
  const lastToastIdRef = useRef(null);
  const seededRef = useRef(false);

  // เด้ง toast แจ้งเตือนด้านบน (สไลด์ลงมา อยู่แป๊บนึง แล้วหายเองแบบ push บนมือถือ)
  const popToast = useCallback((message) => {
    toastTimers.current.forEach(clearTimeout);
    toastTimers.current = [];
    setToast({ message });
    requestAnimationFrame(() => setShow(true));
    toastTimers.current.push(setTimeout(() => setShow(false), 4000));
    toastTimers.current.push(setTimeout(() => setToast(null), 4350));
  }, []);
  useEffect(() => () => toastTimers.current.forEach(clearTimeout), []);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const list = data.items || [];
    setItems(list);
    itemsRef.current = list;
    setUnread(data.unread || 0);
    userIdRef.current = data.userId;

    // เด้ง toast เมื่อมีแจ้งเตือน "ใหม่" (ทำงานทั้งจาก realtime และ polling — ไม่พึ่ง realtime อย่างเดียว)
    const newest = list[0];
    if (newest && seededRef.current && newest.id !== lastToastIdRef.current && !newest.read) {
      popToast(newest.message);
    }
    if (newest) lastToastIdRef.current = newest.id;
    seededRef.current = true;
    return data.userId;
  }, [popToast]);

  // โหลดครั้งแรก + subscribe realtime เฉพาะแจ้งเตือนของเรา
  useEffect(() => {
    let channel;
    let supabase;
    (async () => {
      const uid = await load();
      if (!uid) return;
      try {
        supabase = getSupabase();
      } catch {
        return;
      }
      // topic ไม่ซ้ำต่อการ mount — กัน error "add callbacks after subscribe()" ตอน effect รันซ้ำ (StrictMode/remount)
      channel = supabase
        .channel(`notif-${uid}-${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          () => load() // load() จะ toast แจ้งเตือนใหม่ให้เอง (ทางเดียว กัน toast ซ้ำ)
        )
        .subscribe();
    })();
    return () => {
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [load]);

  // polling fallback — เผื่อ realtime ไม่ติด ก็ยังเห็นแจ้งเตือนใหม่ภายใน ~10 วิ
  useEffect(() => {
    const poll = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") load();
    }, 10000);
    return () => clearInterval(poll);
  }, [load]);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function openMenu() {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((i) => ({ ...i, read: true })));
      await fetch("/api/notifications", { method: "PATCH" });
    }
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={openMenu}
          title="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a3 3 0 1 1-5.714 0m5.714 0a24.255 24.255 0 0 1-5.714 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c1392b] px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="fixed left-2 right-2 top-[62px] z-50 w-auto overflow-hidden rounded-xl border border-line bg-surface shadow-[0_8px_24px_rgba(0,0,0,.12)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
            <div className="border-b border-line px-3 py-2 text-sm font-semibold text-ink">Notifications</div>
            <div className="scroll-soft max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-ink-3">No notifications yet</div>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setOpen(false);
                      if (n.href) router.push(n.href);
                    }}
                    className={`block w-full px-3 py-2.5 text-left transition-colors hover:bg-surface-2 ${n.read ? "" : "bg-brand-soft"}`}
                  >
                    <div className="text-sm text-ink">{n.message}</div>
                    <div className="mt-0.5 text-[11px] text-ink-3">{timeAgo(n.created_at)}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div
          role="button"
          onClick={() => {
            const href = itemsRef.current[0]?.href;
            setShow(false);
            setTimeout(() => setToast(null), 300);
            if (href) router.push(href);
          }}
          style={{ zIndex: 70 }}
          className={`fixed left-1/2 top-4 w-[min(92vw,26rem)] -translate-x-1/2 cursor-pointer rounded-2xl border border-line bg-surface px-4 py-3 shadow-[0_12px_36px_rgba(0,0,0,.20)] transition-all duration-300 ease-out ${
            show ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-base">🔔</div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-dark">TaskHub</div>
              <div className="line-clamp-2 text-sm font-medium text-ink">{toast.message}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
