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
    streak: 6,
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
    streak: 3,
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
    streak: 0,
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
    streak: 12,
    tasksDone: 5,
    tasksTotal: 5,
    blocker: false,
  },
];

// โปรเจกต์ที่ผู้ใช้เป็น "หัวหน้า"
export const projects = [
  { id: "alpha", name: "Project Alpha", initials: "PA", color: "#2E9E5B", desc: "ทีมพัฒนาผลิตภัณฑ์หลัก", memberCount: 5, taskCount: 8 },
  { id: "mkt", name: "Marketing Site", initials: "MS", color: "#FF6B2B", desc: "เว็บการตลาดและแคมเปญ", memberCount: 3, taskCount: 6 },
  { id: "mobile", name: "Mobile App", initials: "MA", color: "#2c5b9e", desc: "แอปมือถือ iOS / Android", memberCount: 4, taskCount: 10 },
  { id: "road", name: "Q3 Roadmap", initials: "Q3", color: "#6b3fa0", desc: "แผนงานไตรมาส 3", memberCount: 6, taskCount: 4 },
  { id: "ds", name: "Design System", initials: "DS", color: "#b8521f", desc: "ระบบดีไซน์กลาง", memberCount: 2, taskCount: 5 },
];

// โปรเจกต์ที่ผู้ใช้เป็น "สมาชิก" (แต่ละบริบทมีหัวหน้าคนละคน)
export const memberProjects = [
  { id: "boss", name: "งานกับหัวหน้า", initials: "หน", color: "#2E9E5B", desc: "งานประจำในบริษัท", leaderName: "Akarawin", taskCount: 4 },
  { id: "friends", name: "งานกับกลุ่มเพื่อน", initials: "พ", color: "#FF6B2B", desc: "โปรเจกต์กลุ่มกับเพื่อน", leaderName: "Mira", taskCount: 3 },
  { id: "prof", name: "งานกับอาจารย์", initials: "อ", color: "#6b3fa0", desc: "วิชา Capstone Project", leaderName: "อ.สมชาย", taskCount: 5 },
];

export function getProject(id) {
  return (
    [...projects, ...memberProjects].find((p) => p.id === id) || {
      id,
      name: "โปรเจกต์",
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

export const moods = {
  great: { label: "ดีมาก", emoji: "😄", color: "#1f7a45", bg: "rgba(46,158,91,.14)" },
  good: { label: "ดี", emoji: "🙂", color: "#2c5b9e", bg: "#E0EEFF" },
  okay: { label: "เฉยๆ", emoji: "😐", color: "#a07a00", bg: "rgba(245,196,0,.18)" },
  stressed: { label: "เครียด", emoji: "😣", color: "#b8521f", bg: "#FFE6D6" },
  blocked: { label: "ติดปัญหา", emoji: "🚧", color: "#c1392b", bg: "rgba(193,57,43,.12)" },
};

export const priorityStyle = {
  high: { label: "High", color: "#FF6B2B", bg: "rgba(255,107,43,.12)" },
  medium: { label: "Medium", color: "#a07a00", bg: "rgba(245,196,0,.18)" },
  low: { label: "Low", color: "#5A5A5A", bg: "#F0F0F0" },
};

export const statusStyle = {
  todo: { label: "Todo", color: "#5A5A5A", bg: "#F0F0F0", bar: "#C4C4C4" },
  in_progress: { label: "In Progress", color: "#FF6B2B", bg: "rgba(255,107,43,.12)", bar: "#FF6B2B" },
  done: { label: "Done ✓", color: "#ffffff", bg: "#2E9E5B", bar: "#2E9E5B" },
};

// My tasks for the logged-in member view (mock = Mira)
export const myTasks = tasks.filter((t) => t.assignee.id === members[0].id);
export const currentMember = members[0];
