import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getDbUser, listProjects, getProjectById, getMemberNavCounts, getMembership } from "@/lib/data";

export default async function MemberProjectLayout({ children, params }) {
  const { projectId } = await params;
  const user = await getDbUser();

  // เพิ่งถูกแต่งตั้งเป็นDeputy/หัวหน้า (มีสิทธิ์จัดการ) ขณะเปิดหน้า member อยู่ → สลับไป workspace หัวหน้าอัตโนมัติ
  if (user) {
    const membership = await getMembership(projectId, user.id);
    const hasMgmtAccess =
      membership &&
      (membership.role === "leader" ||
        (membership.role === "deputy" && (membership.permissions || []).length > 0));
    if (hasMgmtAccess) redirect(`/leader/${projectId}`);
  }

  const [project, projects, counts] = await Promise.all([
    getProjectById(projectId),
    user ? listProjects(user.id, "member") : [],
    user ? getMemberNavCounts(projectId, user.id) : { revision: 0, checkin: 0 },
  ]);

  const nav = [
    { href: `/member/${projectId}`, label: "My tasks", icon: "📋", color: "#FF6B2B", badge: counts.revision },
    { href: `/member/${projectId}/calendar`, label: "Calendar", icon: "🗓", color: "#c0873a" },
    { href: `/member/${projectId}/history`, label: "Completed", icon: "🏆", color: "#2E9E5B" },
    { href: `/member/${projectId}/members`, label: "Team members", icon: "👥", color: "#2c5b9e" },
    { href: `/member/${projectId}/checkin`, label: "Check in today", icon: "✅", color: "#2E9E5B" },
  ];

  return (
    <AppShell
      nav={nav}
      title={project?.name || "Project"}
      roleLabel="Member"
      base="/member"
      projects={projects}
      projectId={projectId}
    >
      {children}
    </AppShell>
  );
}
