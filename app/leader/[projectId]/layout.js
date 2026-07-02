import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getDbUser, listProjects, getProjectById, getLeaderNavCounts, getMembership, can, PERM } from "@/lib/data";

export default async function LeaderProjectLayout({ children, params }) {
  const { projectId } = await params;
  const user = await getDbUser();
  const membership = await getMembership(projectId, user?.id);

  // มุมมองจัดการ = หัวหน้า หรือ รองหัวหน้าที่มีสิทธิ์อย่างน้อย 1 อย่าง — คนอื่นเด้งไปมุมมองสมาชิก
  const hasMgmtAccess =
    membership &&
    (membership.role === "leader" ||
      (membership.role === "deputy" && (membership.permissions || []).length > 0));
  if (!hasMgmtAccess) {
    redirect(membership ? `/member/${projectId}` : "/member");
  }

  const [project, projects, counts] = await Promise.all([
    getProjectById(projectId),
    user ? listProjects(user.id, "leader") : [],
    getLeaderNavCounts(projectId),
  ]);
  const isLeader = membership?.role === "leader";
  const roleTitle = membership?.title || (isLeader ? "Leader" : "รองหัวหน้า");

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
      roleLabel={roleTitle}
      isLeader={isLeader}
      base="/leader"
      projects={projects}
      projectId={projectId}
      projectSettings={
        can(membership, PERM.SETTINGS)
          ? { member_visibility: project?.member_visibility || "own", auto_approve: !!project?.auto_approve }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
