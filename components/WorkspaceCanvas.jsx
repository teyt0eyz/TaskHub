"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TaskCard from "@/components/ui/TaskCard";
import TaskDetail from "@/components/TaskDetail";
import AssigneeSelect from "@/components/AssigneeSelect";

const CARD_W = 220;
const CARD_H = 168;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2;
const GREEN = "#2E9E5B";

const LEADER_W = 200;
const LEADER_H = 92;

function dlVal(t) {
  return t?._deadline ? Date.parse(t._deadline) : Infinity;
}

// ---------- LIST layout (Member: งานของตัวเองเรียงตาม deadline) ----------
// getH(key) = ความสูงจริงของการ์ด (วัดหลัง render) เพื่อเว้นระยะไม่ให้ทับกัน
function computeList(tasks, getH) {
  const W = 600;
  const center = W / 2;
  const GAP = 44;
  const firstTop = 40 + LEADER_H + GAP;
  const rootBottom = 40 + LEADER_H;

  const items = [];
  const paths = [];
  let y = firstTop;
  tasks.forEach((t, i) => {
    const h = getH(t.id);
    items.push({ task: t, x: center - CARD_W / 2, y, badge: i + 1, h });
    paths.push({ d: `M ${center} ${y - 14} L ${center} ${y}`, arrow: true });
    y += h + GAP;
  });

  const lastCardTop = items.length ? items[items.length - 1].y : firstTop;
  const contentBottom = items.length ? items[items.length - 1].y + items[items.length - 1].h : firstTop;
  if (tasks.length) {
    paths.unshift({ d: `M ${center} ${rootBottom} L ${center} ${lastCardTop}` });
  }

  return {
    W,
    H: Math.max(contentBottom + 60, 400),
    leader: { x: center - LEADER_W / 2, y: 40, w: LEADER_W, h: LEADER_H },
    heads: [],
    items,
    paths,
  };
}

const MEMBER_H = 78;

// ---------- TREE layout (Leader: กิ่ง = ชื่อ member แล้วงานต่อลงมาเรียงตาม deadline) ----------
function computeTree(tasks, getH) {
  const COL_GAP = 64;
  const ROW_GAP = 40;
  const startX = 40;
  const top = 40;
  const busY = top + LEADER_H + 70;
  const memberTop = busY + 40;
  const firstCardTop = memberTop + MEMBER_H + ROW_GAP;

  // group by assignee — งานที่มอบหลายคนจะโผล่ใต้กิ่งของทุกคน
  const map = new Map();
  for (const t of tasks) {
    const list = t.assignees?.length ? t.assignees : [t.assignee];
    for (const a of list) {
      const key = a?.id || a?.name || "unassigned";
      if (!map.has(key)) map.set(key, { assignee: a, tasks: [] });
      map.get(key).tasks.push(t);
    }
  }
  // แต่ละคน: เรียงงานตาม deadline; คอลัมน์: เรียงตามงานที่ deadline เร็วสุด
  let groups = [...map.values()];
  groups.forEach((g) => g.tasks.sort((a, b) => dlVal(a) - dlVal(b)));
  groups.sort((a, b) => dlVal(a.tasks[0]) - dlVal(b.tasks[0]));

  const numCols = groups.length;
  const colX = (i) => startX + i * (CARD_W + COL_GAP);
  const colCenter = (i) => colX(i) + CARD_W / 2;
  const leaderCenter = numCols > 0 ? (colCenter(0) + colCenter(numCols - 1)) / 2 : startX + CARD_W / 2;

  const heads = [];
  const items = [];
  const paths = [];
  if (numCols > 0) {
    paths.push({ d: `M ${leaderCenter} ${top + LEADER_H} L ${leaderCenter} ${busY}` });
    if (numCols > 1) paths.push({ d: `M ${colCenter(0)} ${busY} L ${colCenter(numCols - 1)} ${busY}` });
  }

  let maxBottom = firstCardTop;
  groups.forEach((g, i) => {
    const cx = colCenter(i);
    // leader → ชื่อ member
    paths.push({ d: `M ${cx} ${busY} L ${cx} ${memberTop}`, arrow: true });
    heads.push({ assignee: g.assignee, x: colX(i), y: memberTop, w: CARD_W, h: MEMBER_H });
    // ชื่อ member → งานแรก
    paths.push({ d: `M ${cx} ${memberTop + MEMBER_H} L ${cx} ${firstCardTop}`, arrow: true });

    // วางการ์ดต่อกันลงมาโดยเว้นระยะตามความสูงจริงของแต่ละใบ (ไม่ทับกัน)
    let y = firstCardTop;
    g.tasks.forEach((t, j) => {
      const key = `${i}-${t.id}`;
      const h = getH(key);
      items.push({ key, task: t, x: colX(i), y, badge: j + 1, h });
      if (j < g.tasks.length - 1) {
        paths.push({ d: `M ${cx} ${y + h} L ${cx} ${y + h + ROW_GAP}`, arrow: true });
      }
      y += h + ROW_GAP;
    });
    maxBottom = Math.max(maxBottom, y - ROW_GAP);
  });

  const contentRight = numCols > 0 ? colX(numCols - 1) + CARD_W : startX + CARD_W;
  const W = Math.max(contentRight + 40, leaderCenter + LEADER_W / 2 + 40, 480);
  const H = maxBottom + 40;

  return {
    W,
    H,
    leader: { x: leaderCenter - LEADER_W / 2, y: top, w: LEADER_W, h: LEADER_H },
    heads,
    items,
    paths,
  };
}

function Connectors({ paths, W, H }) {
  return (
    <svg width={W} height={H} className="pointer-events-none absolute inset-0" style={{ overflow: "visible" }}>
      <defs>
        <marker id="ah" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M1,1 L6,4 L1,7 Z" fill={GREEN} />
        </marker>
      </defs>
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke={GREEN}
          strokeWidth={1.5}
          markerEnd={p.arrow ? "url(#ah)" : undefined}
        />
      ))}
    </svg>
  );
}

export default function WorkspaceCanvas({
  variant = "tree",
  root,
  tasks = [],
  projectId,
  members = [],
  currentUserId,
  dimOthers = false,
  canCreate = true,
  canEdit = false,
  canReview = false,
}) {
  const isList = variant === "list";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMine = (t) => (t.assignees || [t.assignee]).some((a) => a?.id === currentUserId);

  // ป้าย/สีของหัวกิ่งตาม role จริงของแต่ละคน (หัวหน้ามอบงานให้ตัวเองก็จะขึ้น Leader ไม่ใช่ Member)
  // ถ้ามีชื่อบทบาทที่ตั้งเอง (title) ให้แสดง title แทน
  const memberOf = (id) => members.find((m) => m.id === id);
  const roleOf = (id) => memberOf(id)?.role || "member";
  const roleStyle = (role) =>
    role === "leader"
      ? { color: "#2E9E5B", label: "Leader" }
      : role === "deputy"
      ? { color: "#6b3fa0", label: "รองหัวหน้า" }
      : { color: "#FF6B2B", label: "Member" };

  // ความสูงจริงของการ์ด (วัดหลัง render) → ใช้จัดระยะไม่ให้การ์ดทับกัน
  const [heights, setHeights] = useState({});
  const cardEls = useRef({});
  const getH = useCallback((key) => heights[key] || CARD_H, [heights]);

  const geo = useMemo(() => (isList ? computeList(tasks, getH) : computeTree(tasks, getH)), [isList, tasks, getH]);
  const { W: CANVAS_W, H: CANVAS_H, leader, items, paths, heads = [] } = geo;

  // วัดความสูงการ์ดจริงแล้วอัปเดต (รันเมื่อชุดงาน/มุมมองเปลี่ยน)
  useLayoutEffect(() => {
    const next = {};
    for (const key in cardEls.current) {
      const el = cardEls.current[key];
      if (el) next[key] = el.offsetHeight;
    }
    const keys = Object.keys(next);
    const changed =
      keys.length !== Object.keys(heights).length ||
      keys.some((k) => Math.abs((heights[k] || 0) - next[k]) > 0.5);
    if (changed) setHeights(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, isList]);

  const [zoom, setZoom] = useState(0.85);
  const [selected, setSelected] = useState(tasks[0]?.id ?? null);
  const [grabbing, setGrabbing] = useState(false);
  const [detail, setDetail] = useState(null);
  const [adding, setAdding] = useState(false);

  // เปิด task detail อัตโนมัติเมื่อมาจากการกดแจ้งเตือน (?task=<id>)
  useEffect(() => {
    if (!projectId) return;
    const tid = searchParams.get("task");
    if (!tid) return;
    const t = tasks.find((x) => x.id === tid);
    if (t) {
      setDetail(t);
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, tasks, pathname, router, projectId]);
  const [creBusy, setCreBusy] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", deadline: "", assigned_to: [], tags: "" });
  const scrollRef = useRef(null);
  const panRef = useRef(null);
  const movedRef = useRef(false);

  async function createTask(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreBusy(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        title: form.title.trim(),
        description: form.description,
        priority: form.priority,
        deadline: form.deadline || null,
        assigned_to: form.assigned_to,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setCreBusy(false);
    if (res.ok) {
      setAdding(false);
      setForm({ title: "", description: "", priority: "medium", deadline: "", assigned_to: [], tags: "" });
      router.refresh();
    } else {
      alert("สร้างงานไม่สำเร็จ");
    }
  }

  const recenter = useCallback(() => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
        el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
      })
    );
  }, []);

  const fit = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const z = Math.min((el.clientWidth - 96) / CANVAS_W, (el.clientHeight - 96) / CANVAS_H, 1);
    setZoom(Math.max(MIN_ZOOM, z));
    recenter();
  }, [CANVAS_W, CANVAS_H, recenter]);

  useEffect(() => {
    fit();
  }, [fit]);

  const zoomBy = (delta) =>
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 100) / 100)));

  // หมายเหตุ: ไม่ใช้ setPointerCapture เพราะมันทำให้ event click ของการ์ดไม่ทำงาน
  const onPanDown = (e) => {
    if (e.button !== 0) return;
    const el = scrollRef.current;
    panRef.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
    movedRef.current = false;
    setGrabbing(true);
  };
  const onPanMove = (e) => {
    const p = panRef.current;
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
    const el = scrollRef.current;
    el.scrollLeft = p.left - dx;
    el.scrollTop = p.top - dy;
  };
  const onPanUp = () => {
    panRef.current = null;
    setGrabbing(false);
  };

  const selectCard = (id) => {
    if (movedRef.current) return;
    setSelected(id);
    const t = tasks.find((x) => x.id === id);
    if (projectId && t) setDetail(t);
  };

  const onWheel = (e) => {
    // Ctrl/Cmd + ล้อ = ซูม
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 0.1 : -0.1);
      return;
    }
    // Shift + ล้อ = เลื่อนแนวนอน (สำหรับเมาส์ที่มีล้อแนวตั้งอย่างเดียว)
    // ทัชแพด/ล้อแนวนอนยังเลื่อนได้ปกติผ่าน overflow-auto อยู่แล้ว
    if (e.shiftKey && e.deltaX === 0 && scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const rootColor = root?.accent || GREEN;

  return (
    <div className="relative h-full">
      <div
        ref={scrollRef}
        onWheel={onWheel}
        onPointerDown={onPanDown}
        onPointerMove={onPanMove}
        onPointerUp={onPanUp}
        onPointerCancel={onPanUp}
        className={`dot-grid scroll-soft h-full touch-none overflow-auto ${
          grabbing ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
      >
        <div className="flex min-h-full min-w-full items-center justify-center" style={{ padding: "220px" }}>
          <div style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom, flex: "none", position: "relative" }}>
            <div
              style={{
                width: CANVAS_W,
                height: CANVAS_H,
                position: "absolute",
                top: 0,
                left: 0,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
            >
              <Connectors paths={paths} W={CANVAS_W} H={CANVAS_H} />

              {/* root node */}
              <div style={{ position: "absolute", left: leader.x, top: leader.y, width: leader.w }}>
                <div
                  className="flex h-[92px] items-center rounded-[14px] border-2 bg-white px-4"
                  style={{ borderColor: rootColor, boxShadow: `0 3px 12px ${rootColor}22` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-[15px] font-semibold"
                      style={{ borderColor: rootColor, background: root.bg, color: root.color }}
                    >
                      {root.initials}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="text-base font-semibold leading-none text-ink">{root.name}</div>
                      <span
                        className="self-start rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                        style={{ background: rootColor }}
                      >
                        {root.roleLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* member head nodes (กิ่ง = ชื่อคน) — ป้าย/สีตาม role จริง */}
              {heads.map((h, i) => {
                const rs = roleStyle(roleOf(h.assignee?.id));
                return (
                <div
                  key={`head-${i}`}
                  style={{
                    position: "absolute",
                    left: h.x,
                    top: h.y,
                    width: h.w,
                    opacity: dimOthers && h.assignee?.id !== currentUserId ? 0.4 : 1,
                  }}
                >
                  <div
                    className="flex items-center rounded-[14px] border-2 bg-white px-4"
                    style={{ height: h.h, borderColor: rs.color, boxShadow: `0 3px 12px ${rs.color}26` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-[15px] font-semibold"
                        style={{
                          borderColor: rs.color,
                          background: h.assignee?.bg || "#FFE6D6",
                          color: h.assignee?.color || "#b8521f",
                        }}
                      >
                        {h.assignee?.initials || "?"}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-base font-semibold leading-none text-ink">
                          {h.assignee?.name || "ไม่ระบุผู้รับผิดชอบ"}
                        </div>
                        <span
                          className="self-start rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                          style={{ background: rs.color }}
                        >
                          {memberOf(h.assignee?.id)?.title || rs.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}

              {/* task cards — ความสูงยืดตามเนื้อหา (วัดจริงเพื่อจัดระยะ) */}
              {items.map((it) => {
                const k = it.key || it.task.id;
                return (
                <div
                  key={k}
                  ref={(el) => {
                    if (el) cardEls.current[k] = el;
                    else delete cardEls.current[k];
                  }}
                  style={{
                    position: "absolute",
                    left: it.x,
                    top: it.y,
                    width: CARD_W,
                    opacity: dimOthers && !isMine(it.task) ? 0.45 : 1,
                  }}
                >
                  {it.badge != null && (
                    <span
                      className="absolute -left-3 -top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand text-xs font-bold text-white shadow-sm"
                      title={`ลำดับ deadline #${it.badge}`}
                    >
                      {it.badge}
                    </span>
                  )}
                  <TaskCard task={it.task} selected={selected === it.task.id} onClick={() => selectCard(it.task.id)} />
                </div>
                );
              })}

              {tasks.length === 0 && (
                <div
                  style={{ position: "absolute", left: leader.x - 10, top: leader.y + LEADER_H + 50, width: 240 }}
                  className="rounded-xl border border-dashed border-line bg-white/70 py-10 text-center text-sm text-ink-3"
                >
                  ยังไม่มีงาน{isList ? "ที่ได้รับมอบหมาย" : " — กดปุ่ม + เพื่อเพิ่ม"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isList && tasks.length > 0 && (
        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-line bg-white/85 px-3.5 py-1.5 text-xs font-medium text-ink-2 shadow-sm backdrop-blur">
          ⬇ เรียงตาม deadline · ใกล้ที่สุดอยู่บนสุด
        </div>
      )}

      {/* Floating controls */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-3">
        {!isList && projectId && canCreate && (
          <button
            onClick={() => setAdding(true)}
            title="เพิ่มงาน"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl font-light leading-none text-white shadow-[0_4px_14px_rgba(255,107,43,.35)] hover:bg-[#f55e1d]"
          >
            +
          </button>
        )}
        <button
          title="พอดีหน้าจอ"
          onClick={fit}
          className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-brand bg-white text-lg text-brand shadow-[0_2px_10px_rgba(0,0,0,.08)] hover:bg-brand-soft"
        >
          ⤢
        </button>
      </div>

      <div className="absolute bottom-5 right-5 flex items-center gap-1 rounded-full border border-line bg-white px-1.5 py-1 shadow-[0_2px_10px_rgba(0,0,0,.08)]">
        <button onClick={() => zoomBy(-0.1)} className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink-2 hover:bg-surface-2" title="ซูมออก">−</button>
        <span className="w-12 text-center text-xs font-semibold tabular-nums text-ink-2">{Math.round(zoom * 100)}%</span>
        <button onClick={() => zoomBy(0.1)} className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink-2 hover:bg-surface-2" title="ซูมเข้า">+</button>
      </div>

      {detail && (
        <TaskDetail
          task={detail}
          projectId={projectId}
          onClose={() => setDetail(null)}
          canComment={(detail.assignees || [detail.assignee]).some((a) => a?.id === currentUserId)}
          canEdit={canEdit}
          canReview={canReview}
          members={members}
          currentUserId={currentUserId}
        />
      )}

      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setAdding(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={createTask} className="w-full max-w-md space-y-3 rounded-2xl border border-line bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ink">สร้างงานใหม่</h2>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">ชื่องาน</label>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="เช่น ทำหน้า login"
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">รายละเอียด (ไม่บังคับ)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="อธิบายรายละเอียดงาน สิ่งที่ต้องทำ ข้อกำหนด ฯลฯ"
                className="w-full resize-none rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-ink-2">ความด่วน (Priority)</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-brand">
                  <option value="low">ต่ำ (Low)</option>
                  <option value="medium">ปานกลาง (Medium)</option>
                  <option value="high">สูง (High)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-ink-2">กำหนดส่ง (Deadline)</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">มอบหมายให้ (เลือกได้หลายคน)</label>
              <AssigneeSelect
                members={members}
                currentUserId={currentUserId}
                value={form.assigned_to}
                onChange={(v) => setForm({ ...form, assigned_to: v })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-2">แท็ก (ไม่บังคับ)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="คั่นด้วย , เช่น Design, Frontend"
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setAdding(false)} className="rounded-[10px] border border-line px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2">ยกเลิก</button>
              <button type="submit" disabled={creBusy} className="rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-[#f55e1d] disabled:opacity-60">
                {creBusy ? "กำลังสร้าง..." : "สร้างงาน"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
