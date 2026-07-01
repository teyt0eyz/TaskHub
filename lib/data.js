// Server-only data layer — แปลงข้อมูลจาก Supabase ให้เป็นรูปแบบที่ UI ใช้อยู่
// ห้าม import ในไฟล์ที่เป็น "use client"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const PALETTE = [
  { color: "#1f7a45", bg: "rgba(46,158,91,.16)" },
  { color: "#b8521f", bg: "#FFE6D6" },
  { color: "#2c5b9e", bg: "#E0EEFF" },
  { color: "#6b3fa0", bg: "#EDE0FF" },
  { color: "#a07a00", bg: "rgba(245,196,0,.18)" },
];

function hash(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function initialsOf(nameOrEmail = "") {
  const s = String(nameOrEmail).trim();
  if (!s) return "?";
  const parts = s.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

function person(userRow) {
  if (!userRow) return { id: null, name: "—", initials: "?", color: "#5A5A5A", bg: "#F0F0F0" };
  const name = userRow.name || userRow.email || "ผู้ใช้";
  const c = PALETTE[hash(userRow.id || name) % PALETTE.length];
  return { id: userRow.id, name, initials: initialsOf(name), color: c.color, bg: c.bg };
}

function fmtDate(d) {
  if (!d) return "ไม่กำหนด";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(row) {
  if (!row.deadline || row.status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(row.deadline) < today;
}

function mapTask(row, assignees) {
  const list = assignees && assignees.length ? assignees : [person(null)];
  return {
    id: row.id,
    title: row.title,
    tags: [],
    status: row.status,
    priority: row.priority,
    deadline: fmtDate(row.deadline),
    overdue: isOverdue(row),
    needs_revision: !!row.needs_revision,
    approved: !!row.approved_at, // หัวหน้ายืนยันงานผ่านแล้ว
    _deadline: row.deadline, // ใช้ sort
    _approvedAt: row.approved_at || null,
    assignee: list[0], // ผู้รับผิดชอบหลัก (เผื่อ UI ที่โชว์คนเดียว)
    assignees: list, // ผู้รับผิดชอบทั้งหมด
  };
}

// ---------- current user ----------

export async function getDbUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", session.user.email)
    .maybeSingle();
  return data || null;
}

// ---------- projects ----------

async function projectMeta(supabase, projectIds) {
  // นับ task และ member ของแต่ละโปรเจกต์ (รวม query เดียวต่อชนิด)
  const taskCount = {};
  const memberCount = {};
  if (projectIds.length === 0) return { taskCount, memberCount };
  const [{ data: tasks }, { data: pm }] = await Promise.all([
    supabase.from("tasks").select("project_id").in("project_id", projectIds),
    supabase.from("project_members").select("project_id").in("project_id", projectIds),
  ]);
  for (const t of tasks || []) taskCount[t.project_id] = (taskCount[t.project_id] || 0) + 1;
  for (const m of pm || []) memberCount[m.project_id] = (memberCount[m.project_id] || 0) + 1;
  return { taskCount, memberCount };
}

export async function listProjects(userId, role) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("project_members")
    .select("role, projects(*)")
    .eq("user_id", userId)
    .eq("role", role);
  const projects = (data || []).map((r) => r.projects).filter(Boolean);
  const ids = projects.map((p) => p.id);
  const { taskCount, memberCount } = await projectMeta(supabase, ids);

  // หาชื่อหัวหน้าของแต่ละโปรเจกต์ (สำหรับมุมมอง member)
  let leaderName = {};
  if (role === "member" && ids.length) {
    const { data: leaders } = await supabase
      .from("project_members")
      .select("project_id, users(name, email)")
      .in("project_id", ids)
      .eq("role", "leader");
    for (const l of leaders || [])
      leaderName[l.project_id] = l.users?.name || l.users?.email || "หัวหน้า";
  }

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    desc: p.description || "",
    color: p.color || "#2E9E5B",
    initials: initialsOf(p.name),
    taskCount: taskCount[p.id] || 0,
    memberCount: memberCount[p.id] || 0,
    leaderName: leaderName[p.id] || "—",
  }));
}

export async function getProjectById(id) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  return data;
}

// ---------- tasks ----------

async function usersInProject(supabase, projectId) {
  const { data } = await supabase
    .from("project_members")
    .select("users(*)")
    .eq("project_id", projectId);
  const byId = {};
  for (const r of data || []) if (r.users) byId[r.users.id] = r.users;
  return byId;
}

async function tagsForTasks(supabase, ids) {
  if (!ids.length) return {};
  const { data } = await supabase
    .from("task_tags")
    .select("task_id, tags(name)")
    .in("task_id", ids);
  const map = {};
  for (const r of data || []) {
    if (r.tags?.name) (map[r.task_id] ||= []).push(r.tags.name);
  }
  return map;
}

async function assigneesForTasks(supabase, ids) {
  if (!ids.length) return {};
  const { data } = await supabase.from("task_assignees").select("task_id, user_id").in("task_id", ids);
  const map = {};
  for (const r of data || []) (map[r.task_id] ||= []).push(r.user_id);
  return map;
}

export async function getProjectTasks(projectId) {
  const supabase = getSupabaseAdmin();
  const [{ data: rows }, usersById] = await Promise.all([
    supabase.from("tasks").select("*").eq("project_id", projectId).order("deadline", { ascending: true }),
    usersInProject(supabase, projectId),
  ]);
  const list = rows || [];
  const ids = list.map((r) => r.id);
  const [tagsMap, assigneeMap] = await Promise.all([
    tagsForTasks(supabase, ids),
    assigneesForTasks(supabase, ids),
  ]);
  return list.map((r) => {
    const uids = assigneeMap[r.id]?.length ? assigneeMap[r.id] : r.assigned_to ? [r.assigned_to] : [];
    const persons = uids.map((uid) => person(usersById[uid]));
    return { ...mapTask(r, persons), tags: tagsMap[r.id] || [] };
  });
}

export async function getMyTasks(projectId, userId) {
  // งานที่ฉันเป็นหนึ่งในผู้รับผิดชอบ และยังไม่ถูกยืนยันปิดงาน (active)
  const all = await getProjectTasks(projectId);
  return all.filter((t) => !t.approved && t.assignees.some((a) => a.id === userId));
}

// งานที่ active เท่านั้น (ยังไม่ถูกหัวหน้ายืนยันปิด) — ใช้กับผัง/บอร์ด/ปฏิทิน
export async function getActiveTasks(projectId) {
  const all = await getProjectTasks(projectId);
  return all.filter((t) => !t.approved);
}

// ประวัติงานที่หัวหน้ายืนยันแล้ว จัดกลุ่มตามผู้รับผิดชอบ (เรียงล่าสุดก่อน)
export async function getCompletedByMember(projectId, onlyUserId = null) {
  const all = await getProjectTasks(projectId);
  const done = all
    .filter((t) => t.approved && (!onlyUserId || t.assignees.some((a) => a.id === onlyUserId)))
    .sort((a, b) => new Date(b._approvedAt) - new Date(a._approvedAt));

  const map = new Map();
  for (const t of done) {
    const list = t.assignees?.length ? t.assignees : [t.assignee];
    for (const a of list) {
      if (onlyUserId && a?.id !== onlyUserId) continue;
      const key = a?.id || a?.name || "unassigned";
      if (!map.has(key)) map.set(key, { member: a, tasks: [] });
      map.get(key).tasks.push(t);
    }
  }
  return [...map.values()];
}

// ---------- members (mood / streak / progress) ----------

function isoDay(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function computeStreak(dateSet) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);
  if (!dateSet.has(isoDay(cursor))) {
    cursor.setDate(cursor.getDate() - 1); // อนุญาตให้เริ่มนับจากเมื่อวานได้
    if (!dateSet.has(isoDay(cursor))) return 0;
  }
  let streak = 0;
  while (dateSet.has(isoDay(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function getProjectMembers(projectId) {
  const supabase = getSupabaseAdmin();
  const [{ data: pm }, tasks, { data: checkins }] = await Promise.all([
    supabase.from("project_members").select("role, users(*)").eq("project_id", projectId),
    getProjectTasks(projectId), // ใช้ assignees array
    supabase
      .from("check_ins")
      .select("user_id, date, mood, blockers")
      .eq("project_id", projectId)
      .order("date", { ascending: false }),
  ]);

  return (pm || [])
    .filter((r) => r.users)
    .map((r) => {
      const u = r.users;
      const p = person(u);
      const myTasks = tasks.filter((t) => t.assignees.some((a) => a.id === u.id));
      const tasksDone = myTasks.filter((t) => t.status === "done").length;
      const myCheckins = (checkins || []).filter((c) => c.user_id === u.id);
      const latest = myCheckins[0];
      const dateSet = new Set(myCheckins.map((c) => isoDay(c.date)));
      const mood = latest?.mood || null; // null = ยังไม่เคยเช็คอิน
      return {
        id: u.id,
        name: p.name,
        initials: p.initials,
        color: p.color,
        bg: p.bg,
        role: r.role,
        mood,
        streak: computeStreak(dateSet),
        tasksDone,
        tasksTotal: myTasks.length,
        // ติดปัญหา = เลือก mood "ติดปัญหา" เท่านั้น (ไม่ใช่แค่มีข้อความในช่อง blockers)
        blocker: mood === "blocked",
      };
    });
}

// ป้ายรางวัลตาม streak (gamification)
export function streakBadge(streak) {
  if (streak >= 30) return { emoji: "🏆", label: "ตำนาน 30 วัน" };
  if (streak >= 14) return { emoji: "🥇", label: "ทอง 14 วัน" };
  if (streak >= 7) return { emoji: "🥈", label: "เงิน 7 วัน" };
  if (streak >= 3) return { emoji: "🥉", label: "ทองแดง 3 วัน" };
  return null;
}

// ตัวเลข badge แจ้งเตือนบนเมนู (ฝั่ง leader) — อัปเดตสดผ่าน router.refresh ของ RealtimeRefresher
export async function getLeaderNavCounts(projectId) {
  const supabase = getSupabaseAdmin();
  const [approvalRes, requestRes] = await Promise.all([
    // งานที่ member ทำเสร็จ (done) แต่ยังไม่ได้ยืนยัน → รอหัวหน้าตรวจ
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "done")
      .is("approved_at", null),
    // คำขอเข้าร่วมที่รออนุมัติ
    supabase
      .from("join_requests")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "pending"),
  ]);
  return { approval: approvalRes.count || 0, requests: requestRes.count || 0 };
}

// ตัวเลข badge แจ้งเตือนบนเมนู (ฝั่ง member)
export async function getMemberNavCounts(projectId, userId) {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const [myTasks, ciRes] = await Promise.all([
    getMyTasks(projectId, userId),
    supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("date", today),
  ]);
  const revision = myTasks.filter((t) => t.needs_revision).length; // งานที่ถูกตีกลับ ต้องแก้
  return { revision, checkin: (ciRes.count || 0) > 0 ? 0 : 1 };
}

// คำขอเข้าร่วมที่ยังรออนุมัติ (สำหรับ leader)
export async function getPendingRequests(projectId) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("join_requests")
    .select("id, created_at, users(*)")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return (data || [])
    .filter((r) => r.users)
    .map((r) => {
      const p = person(r.users);
      return { id: r.id, name: p.name, initials: p.initials, color: p.color, bg: p.bg, email: r.users.email };
    });
}

// ดึง check-ins 7 วันล่าสุดของ user ในโปรเจกต์ (สำหรับ AI summary)
export async function getRecentCheckins(projectId, userId) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("check_ins")
    .select("date, done_today, blockers, mood")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(7);
  return data || [];
}
