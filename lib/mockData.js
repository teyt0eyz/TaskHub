// Mock data for the TaskHub frontend.
// ทั้งหมดเป็นข้อมูลปลอมสำหรับ UI เท่านั้น ยังไม่ได้ต่อ Supabase / API จริง

export const currentLeader = {
  id: "u-akarawin",
  name: "Akarawin",
  initials: "AK",
  role: "leader",
  color: "#1f7a45",
  bg: "rgba(46,158,91,.16)",
};

export const members = [
  {
    id: "u-mira",
    name: "Mira",
    initials: "MJ",
    color: "#b8521f",
    bg: "#FFE6D6",
    mood: "good",
    tasksDone: 4,
    tasksTotal: 6,
    blocker: false,
  },
  {
    id: "u-theo",
    name: "Theo",
    initials: "TP",
    color: "#2c5b9e",
    bg: "#E0EEFF",
    mood: "okay",
    tasksDone: 2,
    tasksTotal: 5,
    blocker: false,
  },
  {
    id: "u-sora",
    name: "Sora",
    initials: "SK",
    color: "#6b3fa0",
    bg: "#EDE0FF",
    mood: "blocked",
    tasksDone: 1,
    tasksTotal: 4,
    blocker: true,
  },
  {
    id: "u-nina",
    name: "Nina",
    initials: "NL",
    color: "#1f7a45",
    bg: "rgba(46,158,91,.16)",
    mood: "great",
    tasksDone: 5,
    tasksTotal: 5,
    blocker: false,
  },
];

// โปรเจกต์ที่ผู้ใช้เป็น "Leader"
export const projects = [
  { id: "alpha", name: "Project Alpha", initials: "PA", color: "#2E9E5B", desc: "Core product team", memberCount: 5, taskCount: 8 },
  { id: "mkt", name: "Marketing Site", initials: "MS", color: "#FF6B2B", desc: "Marketing site & campaigns", memberCount: 3, taskCount: 6 },
  { id: "mobile", name: "Mobile App", initials: "MA", color: "#2c5b9e", desc: "iOS / Android mobile app", memberCount: 4, taskCount: 10 },
  { id: "road", name: "Q3 Roadmap", initials: "Q3", color: "#6b3fa0", desc: "Q3 roadmap", memberCount: 6, taskCount: 4 },
  { id: "ds", name: "Design System", initials: "DS", color: "#b8521f", desc: "Central design system", memberCount: 2, taskCount: 5 },
];

// โปรเจกต์ที่ผู้ใช้เป็น "Member" (แต่ละบริบทมีหัวหน้าคนละคน)
export const memberProjects = [
  { id: "boss", name: "Work with my manager", initials: "MG", color: "#2E9E5B", desc: "Day job at the company", leaderName: "Akarawin", taskCount: 4 },
  { id: "friends", name: "Group project", initials: "GP", color: "#FF6B2B", desc: "Group project with friends", leaderName: "Mira", taskCount: 3 },
  { id: "prof", name: "Class project", initials: "CL", color: "#6b3fa0", desc: "Capstone Project course", leaderName: "Prof. Somchai", taskCount: 5 },
];

export function getProject(id) {
  return (
    [...projects, ...memberProjects].find((p) => p.id === id) || {
      id,
      name: "Project",
      initials: "P",
      color: "#2E9E5B",
    }
  );
}

// status: todo | in_progress | done   priority: low | medium | high
export const tasks = [
  {
    id: "t1",
    title: "Design landing page UI",
    tags: ["Design", "Frontend"],
    status: "in_progress",
    priority: "high",
    deadline: "Jul 3",
    overdue: false,
    assignee: members[0],
  },
  {
    id: "t2",
    title: "Write API documentation",
    tags: ["Docs", "Backend"],
    status: "todo",
    priority: "medium",
    deadline: "Jul 5",
    overdue: false,
    assignee: members[1],
  },
  {
    id: "t3",
    title: "Fix login bug",
    tags: ["Bug", "Auth"],
    status: "todo",
    priority: "high",
    deadline: "Jul 2",
    overdue: true,
    assignee: members[2],
  },
  {
    id: "t4",
    title: "Deploy to Vercel",
    tags: ["DevOps", "Release"],
    status: "done",
    priority: "low",
    deadline: "Jul 6",
    overdue: false,
    assignee: currentLeader,
  },
  {
    id: "t5",
    title: "Set up Supabase schema",
    tags: ["Backend", "DB"],
    status: "in_progress",
    priority: "medium",
    deadline: "Jul 4",
    overdue: false,
    assignee: members[3],
  },
  {
    id: "t6",
    title: "Weekly mood report",
    tags: ["AI", "Report"],
    status: "todo",
    priority: "low",
    deadline: "Jul 7",
    overdue: false,
    assignee: members[0],
  },
  {
    id: "t7",
    title: "Refine onboarding flow",
    tags: ["UX", "Frontend"],
    status: "todo",
    priority: "medium",
    deadline: "Jul 1",
    overdue: true,
    assignee: members[0],
  },
  {
    id: "t8",
    title: "Update component library",
    tags: ["Design", "System"],
    status: "in_progress",
    priority: "high",
    deadline: "Jul 4",
    overdue: false,
    assignee: members[0],
  },
];

// สีของ pill อ้างอิง CSS variable ทั้งหมด เพื่อให้พลิกตามธีมอัตโนมัติ
// (ค่าเข้มบนพื้นโปร่งแสงจะอ่านไม่ออกทันทีที่พื้นหลังเป็นสีเข้ม)
export const moods = {
  great: { label: "Great", emoji: "😄", color: "var(--color-brand-text)", bg: "var(--color-brand-soft)" },
  good: { label: "Good", emoji: "🙂", color: "var(--color-info)", bg: "var(--color-info-soft)" },
  okay: { label: "Okay", emoji: "😐", color: "var(--color-warn-text)", bg: "var(--color-warn-soft)" },
  stressed: { label: "Stressed", emoji: "😣", color: "var(--color-ember)", bg: "var(--color-ember-soft)" },
  blocked: { label: "Stuck", emoji: "🚧", color: "var(--color-danger)", bg: "var(--color-danger-soft)" },
};

export const priorityStyle = {
  high: { label: "High", color: "var(--color-accent)", bg: "var(--color-accent-soft)" },
  medium: { label: "Medium", color: "var(--color-warn-text)", bg: "var(--color-warn-soft)" },
  low: { label: "Low", color: "var(--color-ink-2)", bg: "var(--color-surface-2)" },
};

export const statusStyle = {
  todo: { label: "Todo", color: "var(--color-ink-2)", bg: "var(--color-surface-2)", bar: "var(--color-ink-3)" },
  in_progress: { label: "In Progress", color: "var(--color-accent)", bg: "var(--color-accent-soft)", bar: "#FF6B2B" },
  done: { label: "Done ✓", color: "#ffffff", bg: "#2E9E5B", bar: "#2E9E5B" },
};

// My tasks for the logged-in member view (mock = Mira)
export const myTasks = tasks.filter((t) => t.assignee.id === members[0].id);
export const currentMember = members[0];
