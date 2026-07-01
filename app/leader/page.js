import { redirect } from "next/navigation";
import ProjectPicker from "@/components/ProjectPicker";
import { getDbUser, listProjects } from "@/lib/data";

export default async function LeaderIndex() {
  const user = await getDbUser();
  if (!user) redirect("/login");
  const projects = await listProjects(user.id, "leader");
  // มีโปรเจกต์อยู่แล้ว → เข้า workspace อันแรกเลย
  if (projects.length) redirect(`/leader/${projects[0].id}`);
  // ยังไม่มี → หน้าว่างพร้อมปุ่มสร้างโปรเจกต์
  return <ProjectPicker base="/leader" projects={projects} />;
}
