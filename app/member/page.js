import { redirect } from "next/navigation";
import ProjectPicker from "@/components/ProjectPicker";
import { getDbUser, listProjects } from "@/lib/data";

export default async function MemberIndex({ searchParams }) {
  const user = await getDbUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const projects = await listProjects(user.id, "member");
  // เป็นสมาชิกอยู่แล้ว → เข้า workspace อันแรกเลย (ยกเว้นสั่งดูรายการทั้งหมดด้วย ?all)
  if (projects.length && !sp?.all) redirect(`/member/${projects[0].id}`);
  // แสดงหน้ารายการโปรเจกต์ (เลือก/กรอกโค้ดเข้าร่วม)
  return <ProjectPicker base="/member" projects={projects} />;
}
