import CompletedHistory from "@/components/CompletedHistory";
import { getCompletedByMember } from "@/lib/data";

export default async function LeaderHistoryPage({ params }) {
  const { projectId } = await params;
  const groups = await getCompletedByMember(projectId);
  const total = groups.reduce((n, g) => n + g.tasks.length, 0);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-ink">ประวัติงานเสร็จ</h1>
        <p className="mt-0.5 text-sm text-ink-2">งานที่ยืนยันผ่านแล้ว แยกตามสมาชิก ({total} งาน)</p>
      </div>
      <CompletedHistory groups={groups} />
    </div>
  );
}
