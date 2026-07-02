import TasksBoard from "@/components/TasksBoard";
import { getDbUser, getActiveTasks, getProjectMembers, getMembership, can, PERM } from "@/lib/data";

export default async function LeaderTasksPage({ params }) {
  const { projectId } = await params;
  const user = await getDbUser();
  const [tasks, members, membership] = await Promise.all([
    getActiveTasks(projectId, user?.id),
    getProjectMembers(projectId),
    getMembership(projectId, user?.id),
  ]);
  const memberOpts = members.map((m) => ({ id: m.id, name: m.name, role: m.role, title: m.title }));
  return (
    <TasksBoard
      projectId={projectId}
      tasks={tasks}
      members={memberOpts}
      currentUserId={user?.id}
      canEdit={can(membership, PERM.TASKS)}
      canReview={can(membership, PERM.REVIEW)}
    />
  );
}
