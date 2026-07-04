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
  const name = userRow.name || userRow.email || "User";
  const c = PALETTE[hash(userRow.id || name) % PALETTE.length];
  return { id: userRow.id, name, initials: initialsOf(name), color: c.color, bg: c.bg };
}

function fmtDate(d) {
  if (!d) return "No deadline";
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
    description: row.description || "",
    tags: [],
    status: row.status,
    priority: row.priority,
    deadline: fmtDate(row.deadline),
    overdue: isOverdue(row),
    needs_revision: !!row.needs_revision,
    approved: !!row.approved_at, // หัวหน้าApprove taskแล้ว
    _deadline: row.deadline, // ใช้ sort
    _approvedAt: row.approved_at || null,
    assignee: list[0], // ผู้รับผิดชอบหลัก (เผื่อ UI ที่โชว์คนเGoodยว)
    assignees: list, // ผู้รับผิดชอบทั้งหมด
  };
}

// ---------- roles & permissions ----------

// สิทธิ์ที่หัวหน้ามอบให้Deputyได้
export const PERM = {
  REVIEW: "review", // Review work: ยืนยัน/ตีกลับCompleted
  TASKS: "manage_tasks", // Manage tasks: สร้าง/Edit/ลบ/มอบหมาย
  MEMBERS: "manage_members", // Manage members: Approveคำขอ/นำออก
  SETTINGS: "settings", // Project settings
  AI: "ai", // AI summary (ใช้โควตาของโปรเจกต์ร่วมกัน)
};

// ---------- AI quota (นับต่อโปรเจกต์ 4 ครั้ง/เดือน) ----------

export const AI_LIMIT = 4;
function aiPeriodStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
export function aiNextReset(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}
function aiUsedOf(project) {
  const r = project?.ai_summary_reset_at ? new Date(project.ai_summary_reset_at) : null;
  if (!r || r < aiPeriodStart()) return 0; // ข้ามเดือน = เริ่มนับใหม่
  return project?.ai_summary_count || 0;
}

export async function getProjectAiQuota(projectId) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("projects")
    .select("ai_summary_count, ai_summary_reset_at")
    .eq("id", projectId)
    .maybeSingle();
  const used = aiUsedOf(data);
  return { used, remaining: Math.max(0, AI_LIMIT - used), limit: AI_LIMIT, resetAt: aiNextReset() };
}

export async function bumpProjectAiCount(projectId) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("projects")
    .select("ai_summary_count, ai_summary_reset_at")
    .eq("id", projectId)
    .maybeSingle();
  const next = aiUsedOf(data) + 1;
  await supabase
    .from("projects")
    .update({ ai_summary_count: next, ai_summary_reset_at: aiPeriodStart().toISOString() })
    .eq("id", projectId);
  return next;
}

export async function getMembership(projectId, userId) {
  if (!projectId || !userId) return null;
  const supabase = getSupabaseAdmin();
  let { data, error } = await supabase
    .from("project_members")
    .select("role, permissions, title")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  // เผื่อยังไม่ได้รัน migration (ไม่มีคอลัมน์ permissions) → ดึงแค่ role
  if (error) {
    ({ data } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle());
  }
  return data || null;
}

// leader = ได้ทุกสิทธิ์, deputy = เฉพาะที่ได้รับ, member = ไม่ได้
export function can(membership, perm) {
  if (!membership) return false;
  if (membership.role === "leader") return true;
  if (membership.role === "deputy") return (membership.permissions || []).includes(perm);
  return false;
}

// ---------- ลำดับตำแหน่ง (role rank) ----------
// หัวหน้า > Deputy > สมาชิก — ใช้กันไม่ให้ตำแหน่งต่ำกว่าไปมอบงาน/สรุป AI ให้คนที่สูงกว่า
export const ROLE_RANK = { leader: 3, deputy: 2, member: 1 };
export function roleRank(role) {
  return ROLE_RANK[role] || 1;
}
// actor มอบหมาย/สรุป target ได้ไหม: ทำกับตัวเองได้เสมอ นอกนั้นต้องเป็นตำแหน่ง "ต่ำกว่า" เท่านั้น
export function canTargetRole(actorRole, targetRole, isSelf = false) {
  if (isSelf) return true;
  return roleRank(targetRole) < roleRank(actorRole);
}

// map user_id → role ของEveryoneในโปรเจกต์ (ใช้ตรวจสิทธิ์ตอนมอบงานหลายคน)
export async function getProjectRoleMap(projectId) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("project_members").select("user_id, role").eq("project_id", projectId);
  const map = {};
  for (const r of data || []) map[r.user_id] = r.role;
  return map;
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
  // นับ task และ member ของแต่ละโปรเจกต์ (รวม query เGoodยวต่อชนิด)
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
  // ฝั่ง "leader" รวมทั้งหัวหน้าและDeputy (deputy) ให้เห็นในมุมมองจัดการ
  const roles = role === "leader" ? ["leader", "deputy"] : ["member"];
  const { data } = await supabase
    .from("project_members")
    .select("role, projects(*)")
    .eq("user_id", userId)
    .in("role", roles);
  const projects = (data || []).map((r) => r.projects).filter(Boolean);
  const roleByProject = {};
  for (const r of data || []) if (r.projects) roleByProject[r.projects.id] = r.role;
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
      leaderName[l.project_id] = l.users?.name || l.users?.email || "Leader";
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
    myRole: roleByProject[p.id] || null, // บทบาทของผู้ชมในโปรเจกต์นี้ (leader/deputy/member)
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

// นับคอมเมนต์ใหม่ (ยังไม่อ่าน) ต่อ task สำหรับผู้ชม 1 คน จากตาราง notifications
async function unreadCommentsFor(supabase, viewerId, ids) {
  if (!viewerId || !ids.length) return {};
  const { data } = await supabase
    .from("notifications")
    .select("task_id")
    .eq("user_id", viewerId)
    .eq("type", "comment")
    .eq("read", false)
    .in("task_id", ids);
  const map = {};
  for (const r of data || []) map[r.task_id] = (map[r.task_id] || 0) + 1;
  return map;
}

export async function getProjectTasks(projectId, viewerId = null) {
  const supabase = getSupabaseAdmin();
  const [{ data: rows }, usersById] = await Promise.all([
    supabase.from("tasks").select("*").eq("project_id", projectId).order("deadline", { ascending: true }),
    usersInProject(supabase, projectId),
  ]);
  const list = rows || [];
  const ids = list.map((r) => r.id);
  const [tagsMap, assigneeMap, unreadMap] = await Promise.all([
    tagsForTasks(supabase, ids),
    assigneesForTasks(supabase, ids),
    unreadCommentsFor(supabase, viewerId, ids),
  ]);
  return list.map((r) => {
    const uids = assigneeMap[r.id]?.length ? assigneeMap[r.id] : r.assigned_to ? [r.assigned_to] : [];
    const persons = uids.map((uid) => person(usersById[uid]));
    return { ...mapTask(r, persons), tags: tagsMap[r.id] || [], unreadComments: unreadMap[r.id] || 0 };
  });
}

export async function getMyTasks(projectId, userId) {
  // งานที่ฉันเป็นหนึ่งในผู้รับผิดชอบ และยังไม่ถูกยืนยันปิดงาน (active)
  const all = await getProjectTasks(projectId, userId);
  return all.filter((t) => !t.approved && t.assignees.some((a) => a.id === userId));
}

// งานที่ active เท่านั้น (ยังไม่ถูกหัวหน้ายืนยันปิด) — ใช้กับผัง/บอร์ด/Calendar
export async function getActiveTasks(projectId, viewerId = null) {
  const all = await getProjectTasks(projectId, viewerId);
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

// ---------- members (mood / progress) ----------

export async function getProjectMembers(projectId) {
  const supabase = getSupabaseAdmin();
  const [pmRes, tasks, { data: checkins }] = await Promise.all([
    supabase.from("project_members").select("role, permissions, title, status, users(*)").eq("project_id", projectId),
    getProjectTasks(projectId), // ใช้ assignees array
    supabase
      .from("check_ins")
      .select("user_id, date, mood, blockers")
      .eq("project_id", projectId)
      .order("date", { ascending: false }),
  ]);

  // เผื่อยังไม่ได้รัน migration (ไม่มีคอลัมน์ permissions) → ดึงใหม่โดยไม่เอา permissions
  let pm = pmRes.data;
  if (pmRes.error) {
    ({ data: pm } = await supabase.from("project_members").select("role, users(*)").eq("project_id", projectId));
  }

  return (pm || [])
    .filter((r) => r.users)
    .map((r) => {
      const u = r.users;
      const p = person(u);
      const myTasks = tasks.filter((t) => t.assignees.some((a) => a.id === u.id));
      const tasksDone = myTasks.filter((t) => t.status === "done").length;
      const myCheckins = (checkins || []).filter((c) => c.user_id === u.id);
      const latest = myCheckins[0];
      const mood = latest?.mood || null; // null = Never checked in
      return {
        id: u.id,
        name: p.name,
        initials: p.initials,
        color: p.color,
        bg: p.bg,
        role: r.role,
        permissions: r.permissions || [],
        title: r.title || null,
        status: r.status || null,
        mood,
        tasksDone,
        tasksTotal: myTasks.length,
        // Stuck = เลือก mood "Stuck" เท่านั้น (ไม่ใช่แค่มีข้อความในช่อง blockers)
        blocker: mood === "blocked",
      };
    });
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
    // Pending join requests
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

// Join requestsที่ยังรอApprove (สำหรับ leader)
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

// รายชื่อสมาชิกแบบเบา (สำหรับให้ member ดูเพื่อนร่วมทีม) — ชื่อ/ตำแหน่ง/status เท่านั้น ไม่มี mood/ความคืบหน้า
export async function getTeamRoster(projectId) {
  const supabase = getSupabaseAdmin();
  let { data, error } = await supabase
    .from("project_members")
    .select("role, title, status, status_updated_at, users(*)")
    .eq("project_id", projectId);
  if (error) {
    ({ data } = await supabase.from("project_members").select("role, users(*)").eq("project_id", projectId));
  }
  return (data || [])
    .filter((r) => r.users)
    .map((r) => {
      const p = person(r.users);
      return {
        id: r.users.id,
        name: p.name,
        initials: p.initials,
        color: p.color,
        bg: p.bg,
        role: r.role,
        title: r.title || null,
        status: r.status || null,
        statusUpdatedAt: r.status_updated_at || null,
      };
    })
    .sort((a, b) => roleRank(b.role) - roleRank(a.role) || a.name.localeCompare(b.name, "th"));
}

// ผู้ใช้เปิด/ปิดการEmail notifications (ระดับบัญชี ใช้ทุกโปรเจกต์)
export async function setEmailNotifications(userId, value) {
  const supabase = getSupabaseAdmin();
  await supabase.from("users").update({ email_notifications: !!value }).eq("id", userId);
  return !!value;
}

// สมาชิกตั้ง status ของตัวเอง (Available/ประชุม/Lunch break/ข้อความเอง) — ตัดให้ไม่เกิน 60 ตัวอักษร, Available = ล้าง
export async function setMemberStatus(projectId, userId, status) {
  const supabase = getSupabaseAdmin();
  const clean = (status ?? "").toString().trim().slice(0, 60) || null;
  await supabase
    .from("project_members")
    .update({ status: clean, status_updated_at: clean ? new Date().toISOString() : null })
    .eq("project_id", projectId)
    .eq("user_id", userId);
  return clean;
}

// ---------- AI summaries (เก็บในระบบ เพื่อให้หัวหน้า/Deputyเห็นร่วมกัน) ----------

export async function saveAiSummary({ projectId, targetUserId = null, scope = "member", summary, generatedBy }) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("ai_summaries")
    .insert({ project_id: projectId, target_user_id: targetUserId, scope, summary, generated_by: generatedBy })
    .select("id, summary, created_at, generated_by")
    .single();
  return data;
}

// ประวัติสรุป (ใหม่สุดก่อน) — แนบชื่อผู้ generate ด้วย
export async function listAiSummaries(projectId, { scope = "member", targetUserId = null, limit = 12 } = {}) {
  const supabase = getSupabaseAdmin();
  let q = supabase
    .from("ai_summaries")
    .select("id, summary, created_at, generated_by")
    .eq("project_id", projectId)
    .eq("scope", scope)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (scope === "member") q = q.eq("target_user_id", targetUserId);
  const { data } = await q;
  const rows = data || [];
  const genIds = [...new Set(rows.map((r) => r.generated_by).filter(Boolean))];
  let names = {};
  if (genIds.length) {
    const { data: us } = await supabase.from("users").select("id, name, email").in("id", genIds);
    for (const u of us || []) names[u.id] = u.name || u.email;
  }
  return rows.map((r) => ({ id: r.id, summary: r.summary, at: r.created_at, by: names[r.generated_by] || null }));
}

export async function deleteAiSummaryById(id) {
  const supabase = getSupabaseAdmin();
  await supabase.from("ai_summaries").delete().eq("id", id);
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
