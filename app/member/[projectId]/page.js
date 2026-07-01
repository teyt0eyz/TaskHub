import { redirect } from "next/navigation";
import WorkspaceCanvas from "@/components/WorkspaceCanvas";
import { getDbUser, getMyTasks, getActiveTasks, getProjectById, initialsOf } from "@/lib/data";

export default async function MemberWorkspacePage({ params }) {
  const { projectId } = await params;
  const user = await getDbUser();
  if (!user) redirect("/login");

  const project = await getProjectById(projectId);

  // โหมด "เห็นงานทุกคน" — แสดงผังทั้งทีม งานคนอื่นจางลง (หัวหน้าเป็นคนเปิด)
  if (project?.member_visibility === "all") {
    const tasks = await getActiveTasks(projectId);
    const root = {
      name: project.name,
      initials: initialsOf(project.name),
      color: "#1f7a45",
      bg: "rgba(46,158,91,.16)",
      accent: "#2E9E5B",
      roleLabel: "Team",
    };
    return (
      <WorkspaceCanvas
        variant="tree"
        root={root}
        tasks={tasks}
        projectId={projectId}
        currentUserId={user.id}
        dimOthers
        canCreate={false}
      />
    );
  }

  // โหมดปกติ — เห็นเฉพาะงานของตัวเอง (เรียงตาม deadline)
  const tasks = await getMyTasks(projectId, user.id);
  const root = {
    name: user.name || user.email || "Member",
    initials: initialsOf(user.name || user.email || "M"),
    color: "#b8521f",
    bg: "#FFE6D6",
    accent: "#FF6B2B",
    roleLabel: "Member",
  };

  return (
    <WorkspaceCanvas variant="list" root={root} tasks={tasks} projectId={projectId} currentUserId={user.id} />
  );
}
