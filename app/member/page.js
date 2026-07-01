import { redirect } from "next/navigation";
import ProjectPicker from "@/components/ProjectPicker";
import { getDbUser, listProjects } from "@/lib/data";

export default async function MemberIndex() {
  const user = await getDbUser();
  if (!user) redirect("/login");
  const projects = await listProjects(user.id, "member");
  // เป็นสมาชิกอยู่แล้ว → เข้า workspace อันแรกเลย
  if (projects.length) redirect(`/member/${projects[0].id}`);
  // ยังไม่ได้เข้าร่วม → หน้าว่างพร้อมปุ่มกรอกโค้ด
  return <ProjectPicker base="/member" projects={projects} />;
}
