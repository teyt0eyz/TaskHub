import AppShell from "@/components/AppShell";
import { getDbUser, listProjects, getProjectById, getMemberNavCounts } from "@/lib/data";

export default async function MemberProjectLayout({ children, params }) {
  const { projectId } = await params;
  const user = await getDbUser();
  const [project, projects, counts] = await Promise.all([
    getProjectById(projectId),
    user ? listProjects(user.id, "member") : [],
    user ? getMemberNavCounts(projectId, user.id) : { revision: 0, checkin: 0 },
  ]);

  const nav = [
    { href: `/member/${projectId}`, label: "งานของฉัน", icon: "📋", color: "#FF6B2B", badge: counts.revision },
    { href: `/member/${projectId}/calendar`, label: "ปฏิทิน", icon: "🗓", color: "#c0873a" },
    { href: `/member/${projectId}/history`, label: "งานที่เสร็จ", icon: "🏆", color: "#2E9E5B" },
    { href: `/member/${projectId}/checkin`, label: "เช็คอินวันนี้", icon: "✅", color: "#2E9E5B" },
  ];

  return (
    <AppShell
      nav={nav}
      title={project?.name || "โปรเจกต์"}
      roleLabel="Member"
      base="/member"
      projects={projects}
      projectId={projectId}
    >
      {children}
    </AppShell>
  );
}
