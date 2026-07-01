"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

function timeAgo(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "เมื่อสักครู่";
  if (d < 3600) return `${Math.floor(d / 60)} นาทีก่อน`;
  if (d < 86400) return `${Math.floor(d / 3600)} ชม.ก่อน`;
  return `${Math.floor(d / 86400)} วันก่อน`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState("");
  const ref = useRef(null);
  const userIdRef = useRef(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items || []);
    setUnread(data.unread || 0);
    userIdRef.current = data.userId;
    return data.userId;
  }, []);

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
          (payload) => {
            setItems((prev) => [payload.new, ...prev].slice(0, 30));
            setUnread((u) => u + 1);
            setToast(payload.new.message);
            setTimeout(() => setToast(""), 4000);
          }
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
          title="การแจ้งเตือน"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-surface-2"
        >
          🔔
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c1392b] px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-[0_8px_24px_rgba(0,0,0,.12)]">
            <div className="border-b border-line px-3 py-2 text-sm font-semibold text-ink">การแจ้งเตือน</div>
            <div className="scroll-soft max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-ink-3">ยังไม่มีการแจ้งเตือน</div>
              ) : (
                items.map((n) => (
                  <div key={n.id} className={`px-3 py-2.5 ${n.read ? "" : "bg-brand-soft"}`}>
                    <div className="text-sm text-ink">{n.message}</div>
                    <div className="mt-0.5 text-[11px] text-ink-3">{timeAgo(n.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-[60] max-w-xs animate-fade-up rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-[0_6px_20px_rgba(0,0,0,.25)]">
          🔔 {toast}
        </div>
      )}
    </>
  );
}
