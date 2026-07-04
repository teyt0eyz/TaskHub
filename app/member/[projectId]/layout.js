import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  getDbUser,
  listProjects,
  getProjectById,
  getMemberNavCounts,
  getLeaderNavCounts,
  getMembership,
} from "@/lib/data";
import { deputyNav } from "@/lib/nav";

export default async function MemberProjectLayout({ children, params }) {
  const { projectId } = await params;
  const user = await getDbUser();
  const membership = user ? await getMembership(projectId, user.id) : null;

  // หัวหน้าจริง → ใช้โหมดหัวหน้า (member view ไม่ใช่ของหัวหน้า)
  if (membership?.role === "leader") redirect(`/leader/${projectId}`);

  const perms = membership?.permissions || [];
  const isDeputy = membership?.role === "deputy" && perms.length > 0;

  const [project, projects, mCounts, lCounts] = await Promise.all([
    getProjectById(projectId),
    user ? listProjects(user.id, "member") : [],
    user ? getMemberNavCounts(projectId, user.id) : { revision: 0, checkin: 0 },
    isDeputy ? getLeaderNavCounts(projectId) : Promise.resolve({ approval: 0, requests: 0 }),
  ]);

  const nav = isDeputy
    ? deputyNav(projectId, perms, {
        revision: mCounts.revision,
        checkin: mCounts.checkin,
        approval: lCounts.approval,
        requests: lCounts.requests,
      })
    : [
        { href: `/member/${projectId}`, label: "My tasks", icon: "📋", color: "#FF6B2B", badge: mCounts.revision },
        { href: `/member/${projectId}/calendar`, label: "Calendar", icon: "🗓", color: "#c0873a" },
        { href: `/member/${projectId}/history`, label: "Completed", icon: "🏆", color: "#2E9E5B" },
        { href: `/member/${projectId}/members`, label: "Team members", icon: "👥", color: "#2c5b9e" },
        { href: `/member/${projectId}/checkin`, label: "Check in today", icon: "✅", color: "#2E9E5B", badge: mCounts.checkin },
      ];

  return (
    <AppShell
      nav={nav}
      title={project?.name || "Project"}
      roleLabel={isDeputy ? membership.title || "Deputy" : "Member"}
      base="/member"
      projects={projects}
      projectId={projectId}
      hideViewToggle={isDeputy}
      projectSettings={
        isDeputy && perms.includes("settings")
          ? { member_visibility: project?.member_visibility || "own", auto_approve: !!project?.auto_approve }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
