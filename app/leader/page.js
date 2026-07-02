import { redirect } from "next/navigation";
import ProjectPicker from "@/components/ProjectPicker";
import { getDbUser, listProjects } from "@/lib/data";

export default async function LeaderIndex({ searchParams }) {
  const user = await getDbUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const projects = await listProjects(user.id, "leader");
  // มีโปรเจกต์อยู่แล้ว → เข้า workspace อันแรกเลย (ยกเว้นสั่งดูรายการทั้งหมดด้วย ?all)
  if (projects.length && !sp?.all) redirect(`/leader/${projects[0].id}`);
  // แสดงหน้ารายการโปรเจกต์ (เลือก/สร้าง)
  return <ProjectPicker base="/leader" projects={projects} />;
}
