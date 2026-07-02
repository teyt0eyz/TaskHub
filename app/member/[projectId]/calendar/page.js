import { redirect } from "next/navigation";
import CalendarView from "@/components/CalendarView";
import { getDbUser, getMyTasks, getActiveTasks, getProjectById } from "@/lib/data";

export default async function MemberCalendarPage({ params }) {
  const { projectId } = await params;
  const user = await getDbUser();
  if (!user) redirect("/login");

  const project = await getProjectById(projectId);
  // เห็นงานทุกคนถ้าหัวหน้าเปิดโหมด 'all' ไม่งั้นเห็นเฉพาะงานตัวเอง
  const tasks =
    project?.member_visibility === "all"
      ? await getActiveTasks(projectId, user.id)
      : await getMyTasks(projectId, user.id);

  return <CalendarView projectId={projectId} tasks={tasks} currentUserId={user.id} />;
}
