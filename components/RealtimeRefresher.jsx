"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

// อัปเดตหน้าอัตโนมัติโดยไม่ต้องกด refresh:
// 1) Supabase Realtime (ทันทีเมื่อ config ครบ)  2) polling fallback ทุก ~6 วิ (ชัวร์เสมอ)
export default function RealtimeRefresher({ projectId }) {
  const router = useRouter();
  const [pulse, setPulse] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    const refresh = (showPulse) => {
      router.refresh();
      if (showPulse) {
        setPulse(true);
        setTimeout(() => setPulse(false), 1500);
      }
    };

    // ---- polling fallback (ทำงานแน่นอนแม้ realtime ไม่ติด) ----
    const poll = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") refresh(false);
    }, 6000);

    // รีเฟรชทันทีเมื่อกลับมาที่แท็บ
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh(false);
    };
    document.addEventListener("visibilitychange", onVisible);

    // ---- Supabase Realtime (ทันทีเมื่อมีการเปลี่ยน) ----
    let supabase;
    let channel;
    try {
      supabase = getSupabase();
      const trigger = () => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => refresh(true), 300);
      };
      channel = supabase
        .channel(`rt-project-${projectId}-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` }, trigger)
        .on("postgres_changes", { event: "*", schema: "public", table: "task_assignees" }, trigger)
        .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, trigger)
        .on("postgres_changes", { event: "*", schema: "public", table: "check_ins", filter: `project_id=eq.${projectId}` }, trigger)
        .on("postgres_changes", { event: "*", schema: "public", table: "join_requests", filter: `project_id=eq.${projectId}` }, trigger)
        .subscribe((status) => {
          if (status === "SUBSCRIBED") console.debug("[TaskHub] realtime connected");
        });
    } catch {
      /* ไม่มี env / realtime ใช้ไม่ได้ → มี polling รองรับอยู่แล้ว */
    }

    return () => {
      clearInterval(poll);
      clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [projectId, router]);

  if (!pulse) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 animate-fade-up rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(0,0,0,.25)]">
      🔄 อัปเดตล่าสุดแล้ว
    </div>
  );
}
