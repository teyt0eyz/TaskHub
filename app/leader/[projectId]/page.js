import WorkspaceCanvas from "@/components/WorkspaceCanvas";
import { getDbUser, getProjectById, getActiveTasks, getProjectMembers, getMembership, can, PERM, initialsOf } from "@/lib/data";

export default async function LeaderWorkspacePage({ params }) {
  const { projectId } = await params;
  const user = await getDbUser();
  const [project, tasks, members, membership] = await Promise.all([
    getProjectById(projectId),
    getActiveTasks(projectId, user?.id),
    getProjectMembers(projectId),
    getMembership(projectId, user?.id),
  ]);
  const memberOpts = members.map((m) => ({ id: m.id, name: m.name, role: m.role, title: m.title }));

  const projColor = project?.color || "#2E9E5B";
  const root = {
    name: project?.name || "Project",
    initials: initialsOf(project?.name || "P"),
    color: projColor,
    bg: `${projColor}22`,
    accent: projColor,
    roleLabel: "Project",
  };

  // tree แสดง 4 งานแรกของโปรเจกต์
  return (
    <WorkspaceCanvas
      variant="tree"
      root={root}
      tasks={tasks}
      projectId={projectId}
      members={memberOpts}
      currentUserId={user?.id}
      canEdit={can(membership, PERM.TASKS)}
      canReview={can(membership, PERM.REVIEW)}
      canCreate={can(membership, PERM.TASKS)}
    />
  );
}
