import AppShell from "@/components/AppShell";
import { getDbUser, listProjects, getProjectById, getLeaderNavCounts } from "@/lib/data";

export default async function LeaderProjectLayout({ children, params }) {
  const { projectId } = await params;
  const user = await getDbUser();
  const [project, projects, counts] = await Promise.all([
    getProjectById(projectId),
    user ? listProjects(user.id, "leader") : [],
    getLeaderNavCounts(projectId),
  ]);

  const nav = [
    { href: `/leader/${projectId}`, label: "Workspace", icon: "🌳", color: "#2E9E5B", badge: counts.approval },
    { href: `/leader/${projectId}/dashboard`, label: "Dashboard", icon: "📊", color: "#6b3fa0" },
    { href: `/leader/${projectId}/tasks`, label: "งานทั้งหมด", icon: "🗂", color: "#FF6B2B", badge: counts.approval },
    { href: `/leader/${projectId}/calendar`, label: "ปฏิทิน", icon: "🗓", color: "#c0873a" },
    { href: `/leader/${projectId}/history`, label: "ประวัติงานเสร็จ", icon: "🏆", color: "#2E9E5B" },
    { href: `/leader/${projectId}/members`, label: "สมาชิกทีม", icon: "👥", color: "#2c5b9e", badge: counts.requests },
  ];

  return (
    <AppShell
      nav={nav}
      title={project?.name || "โปรเจกต์"}
      roleLabel="Leader"
      base="/leader"
      projects={projects}
      projectId={projectId}
    >
      {children}
    </AppShell>
  );
}
