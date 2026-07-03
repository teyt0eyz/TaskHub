"use client";

import { useEffect, useRef, useState } from "react";

const ROLE_META = {
  leader: { label: "หัวหน้า", color: "#2E9E5B", bg: "rgba(46,158,91,.14)" },
  deputy: { label: "รองหัวหน้า", color: "#6b3fa0", bg: "#EDE0FF" },
  member: { label: "สมาชิก", color: "#b8521f", bg: "#FFE6D6" },
};
const ROLE_ORDER = ["leader", "deputy", "member"];
const metaOf = (m) => ROLE_META[m?.role] || ROLE_META.member;
const chipLabel = (m) => m?.title || metaOf(m).label;

const RANK = { leader: 3, deputy: 2, member: 1 };

export default function AssigneeSelect({ members = [], value = [], onChange, currentUserId = null }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  // มอบหมายได้เฉพาะตัวเอง + คนตำแหน่ง "ต่ำกว่า" (ถ้ารู้ตำแหน่งของผู้ใช้ปัจจุบัน)
  const actorRank = RANK[members.find((m) => m.id === currentUserId)?.role] || 0;
  const pool = actorRank
    ? members.filter((m) => m.id === currentUserId || (RANK[m.role] || 1) < actorRank)
    : members;

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  const allIds = pool.map((m) => m.id);
  const everyone = allIds.length > 0 && allIds.every((id) => value.includes(id));
  const toggleAll = () => onChange(everyone ? [] : allIds);

  // จัดกลุ่มตาม role (สำหรับปุ่มเลือกทั้งหมดตามหมวด)
  const groups = ROLE_ORDER.map((role) => ({
    role,
    ids: pool.filter((m) => (m.role || "member") === role).map((m) => m.id),
  })).filter((g) => g.ids.length > 0);
  const groupAllSelected = (ids) => ids.length > 0 && ids.every((id) => value.includes(id));
  const toggleGroup = (ids) =>
    onChange(groupAllSelected(ids) ? value.filter((v) => !ids.includes(v)) : [...new Set([...value, ...ids])]);

  const label = everyone
    ? `ทุกคน (${allIds.length} คน)`
    : value.length === 0
    ? "มอบหมายให้ฉัน (ค่าเริ่มต้น)"
    : value.length === 1
    ? members.find((m) => m.id === value[0])?.name || "1 คน"
    : `เลือกแล้ว ${value.length} คน`;

  const filtered = pool.filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm outline-none hover:border-brand focus:border-brand"
      >
        <span className={value.length ? "text-ink" : "text-ink-3"}>{label}</span>
        <span className="text-ink-3">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-line bg-white shadow-[0_8px_24px_rgba(0,0,0,.12)]">
          <div className="border-b border-line p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="🔍 ค้นหาสมาชิก..."
              className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand"
            />
          </div>

          {pool.length > 0 && (
            <div className="border-b border-line px-2 py-2">
              {/* มอบให้ทุกคน */}
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-surface-2">
                <input type="checkbox" checked={everyone} onChange={toggleAll} className="h-4 w-4 accent-[#2E9E5B]" />
                <span className="text-sm font-semibold text-ink">👥 มอบให้ทุกคน ({allIds.length})</span>
              </label>
              {/* เลือกทั้งหมดตาม role */}
              {groups.length > 1 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5 px-1">
                  {groups.map((g) => {
                    const on = groupAllSelected(g.ids);
                    const meta = ROLE_META[g.role];
                    return (
                      <button
                        key={g.role}
                        type="button"
                        onClick={() => toggleGroup(g.ids)}
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all"
                        style={
                          on
                            ? { background: meta.color, color: "#fff" }
                            : { background: meta.bg, color: meta.color }
                        }
                      >
                        {on ? "✓ " : "+ "}
                        {meta.label}ทั้งหมด ({g.ids.length})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="scroll-soft max-h-52 overflow-y-auto overscroll-contain py-1">
            {pool.length === 0 && (
              <div className="px-3 py-2 text-xs text-ink-3">ไม่มีสมาชิก — จะมอบให้ตัวเอง</div>
            )}
            {pool.length > 0 && filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-ink-3">ไม่พบสมาชิกที่ค้นหา</div>
            )}
            {filtered.map((m) => {
              const meta = metaOf(m);
              return (
                <label key={m.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-surface-2">
                  <input
                    type="checkbox"
                    checked={value.includes(m.id)}
                    onChange={() => toggle(m.id)}
                    className="h-4 w-4 accent-[#FF6B2B]"
                  />
                  <span
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {chipLabel(m)}
                  </span>
                  <span className="truncate text-sm text-ink">{m.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
