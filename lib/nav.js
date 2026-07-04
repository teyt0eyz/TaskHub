// เมนูของ "รองหัวหน้า" = เมนู member ปกติ + เมนูจัดการที่งอกเพิ่มตามสิทธิ์ที่ได้รับ
// (รองหัวหน้าใช้ workspace ฝั่ง member เสมอ — เช็คอินได้ ไม่มีโหมด leader แยก)
export function deputyNav(projectId, permissions = [], counts = {}) {
  const has = (p) => permissions.includes(p);
  const items = [
    { href: `/member/${projectId}`, label: "My tasks", icon: "📋", color: "#FF6B2B", badge: counts.revision },
  ];

  // จัดการงาน / ตรวจงาน → เห็นบอร์ดงานทั้งทีม
  if (has("manage_tasks") || has("review")) {
    items.push({ href: `/leader/${projectId}/tasks`, label: "All tasks", icon: "🗂", color: "#FF6B2B", badge: counts.approval });
  }
  // จัดการงาน → เห็น Dashboard ภาพรวม
  if (has("manage_tasks")) {
    items.push({ href: `/leader/${projectId}/dashboard`, label: "Dashboard", icon: "📊", color: "#6b3fa0" });
  }

  items.push({ href: `/member/${projectId}/calendar`, label: "Calendar", icon: "🗓", color: "#c0873a" });
  items.push({ href: `/member/${projectId}/history`, label: "Completed", icon: "🏆", color: "#2E9E5B" });

  // จัดการสมาชิก / สรุป AI → หน้าจัดการทีม (อนุมัติคำขอ/นำออก/สรุป AI) แทนหน้ารายชื่อแบบอ่านอย่างเดียว
  if (has("manage_members") || has("ai")) {
    items.push({ href: `/leader/${projectId}/members`, label: "Manage team", icon: "👥", color: "#2c5b9e", badge: counts.requests });
  } else {
    items.push({ href: `/member/${projectId}/members`, label: "Team members", icon: "👥", color: "#2c5b9e" });
  }

  // เช็คอินประจำวัน — รองหัวหน้ายังทำได้เสมอ
  items.push({ href: `/member/${projectId}/checkin`, label: "Check in today", icon: "✅", color: "#2E9E5B", badge: counts.checkin });
  return items;
}
