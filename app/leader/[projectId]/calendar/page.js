import CalendarView from "@/components/CalendarView";
import { getDbUser, getActiveTasks, getProjectMembers } from "@/lib/data";

export default async function LeaderCalendarPage({ params }) {
  const { projectId } = await params;
  const [user, tasks, members] = await Promise.all([
    getDbUser(),
    getActiveTasks(projectId),
    getProjectMembers(projectId),
  ]);
  const memberOpts = members.map((m) => ({ id: m.id, name: m.name }));
  return <CalendarView projectId={projectId} tasks={tasks} members={memberOpts} currentUserId={user?.id} canEdit />;
}
