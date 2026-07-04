import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  getDbUser,
  listProjects,
  getProjectById,
  getLeaderNavCounts,
  getMemberNavCounts,
  getMembership,
  can,
  PERM,
} from "@/lib/data";
import { deputyNav } from "@/lib/nav";

export default async function LeaderProjectLayout({ children, params }) {
  const { projectId } = await params;
  const user = await getDbUser();
  const membership = await getMembership(projectId, user?.id);
  const perms = membership?.permissions || [];

  // มุมมองจัดการ = หัวหน้า หรือ รองหัวหน้าที่มีสิทธิ์อย่างน้อย 1 อย่าง — คนอื่นเด้งไปมุมมองสมาชิก
  const isLeader = membership?.role === "leader";
  const isDeputy = membership?.role === "deputy" && perms.length > 0;
  if (!isLeader && !isDeputy) {
    redirect(membership ? `/member/${projectId}` : "/member");
  }

  const project = await getProjectById(projectId);

  // รองหัวหน้า: ใช้ shell ฝั่ง member (เมนู member + เมนูจัดการตามสิทธิ์) — ไม่มีโหมด leader แยก
  if (isDeputy) {
    const [projects, mCounts, lCounts] = await Promise.all([
      listProjects(user.id, "member"),
      getMemberNavCounts(projectId, user.id),
      getLeaderNavCounts(projectId),
    ]);
    const nav = deputyNav(projectId, perms, {
      revision: mCounts.revision,
      checkin: mCounts.checkin,
      approval: lCounts.approval,
      requests: lCounts.requests,
    });
    return (
      <AppShell
        nav={nav}
        title={project?.name || "Project"}
        roleLabel={membership.title || "Deputy"}
        isLeader={false}
        base="/member"
        projects={projects}
        projectId={projectId}
        hideViewToggle
        projectSettings={
          perms.includes("settings")
            ? { member_visibility: project?.member_visibility || "own", auto_approve: !!project?.auto_approve }
            : null
        }
      >
        {children}
      </AppShell>
    );
  }

  // หัวหน้าจริง
  const [projects, counts] = await Promise.all([listProjects(user.id, "leader"), getLeaderNavCounts(projectId)]);
  const nav = [
    { href: `/leader/${projectId}`, label: "Workspace", icon: "🌳", color: "#2E9E5B", badge: counts.approval },
    { href: `/leader/${projectId}/dashboard`, label: "Dashboard", icon: "📊", color: "#6b3fa0" },
    { href: `/leader/${projectId}/tasks`, label: "All tasks", icon: "🗂", color: "#FF6B2B", badge: counts.approval },
    { href: `/leader/${projectId}/calendar`, label: "Calendar", icon: "🗓", color: "#c0873a" },
    { href: `/leader/${projectId}/history`, label: "Completed history", icon: "🏆", color: "#2E9E5B" },
    { href: `/leader/${projectId}/members`, label: "Team", icon: "👥", color: "#2c5b9e", badge: counts.requests },
  ];

  return (
    <AppShell
      nav={nav}
      title={project?.name || "Project"}
      roleLabel={membership.title || "Leader"}
      isLeader
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
