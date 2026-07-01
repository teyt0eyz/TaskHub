import { redirect } from "next/navigation";
import CompletedHistory from "@/components/CompletedHistory";
import { getDbUser, getCompletedByMember } from "@/lib/data";

export default async function MemberHistoryPage({ params }) {
  const { projectId } = await params;
  const user = await getDbUser();
  if (!user) redirect("/login");

  const groups = await getCompletedByMember(projectId, user.id);
  const total = groups.reduce((n, g) => n + g.tasks.length, 0);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-ink">งานที่เสร็จของฉัน</h1>
        <p className="mt-0.5 text-sm text-ink-2">งานที่หัวหน้ายืนยันผ่านแล้ว ({total} งาน)</p>
      </div>
      <CompletedHistory groups={groups} showMemberHeader={false} />
    </div>
  );
}
