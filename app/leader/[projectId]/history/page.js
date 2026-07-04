import CompletedHistory from "@/components/CompletedHistory";
import { getCompletedByMember } from "@/lib/data";

export default async function LeaderHistoryPage({ params }) {
  const { projectId } = await params;
  const groups = await getCompletedByMember(projectId);
  const total = groups.reduce((n, g) => n + g.tasks.length, 0);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-ink">Completed history</h1>
        <p className="mt-0.5 text-sm text-ink-2">Approved work, grouped by member ({total} tasks)</p>
      </div>
      <CompletedHistory groups={groups} />
    </div>
  );
}
