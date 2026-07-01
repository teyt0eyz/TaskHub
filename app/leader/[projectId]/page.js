import WorkspaceCanvas from "@/components/WorkspaceCanvas";
import { getDbUser, getProjectById, getActiveTasks, getProjectMembers, initialsOf } from "@/lib/data";

export default async function LeaderWorkspacePage({ params }) {
  const { projectId } = await params;
  const [user, project, tasks, members] = await Promise.all([
    getDbUser(),
    getProjectById(projectId),
    getActiveTasks(projectId),
    getProjectMembers(projectId),
  ]);
  const memberOpts = members.map((m) => ({ id: m.id, name: m.name }));

  const root = {
    name: user?.name || project?.name || "Leader",
    initials: initialsOf(user?.name || user?.email || project?.name || "L"),
    color: "#1f7a45",
    bg: "rgba(46,158,91,.16)",
    accent: "#2E9E5B",
    roleLabel: "Leader",
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
      canEdit
    />
  );
}
