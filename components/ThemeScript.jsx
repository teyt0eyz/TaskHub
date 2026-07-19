/*
 * รันก่อน React hydrate เพื่อไม่ให้จอ "กะพริบขาว" ตอนผู้ใช้เลือกธีมมืดไว้
 * ค่า default คือ light — ต้องเคยกดเลือก "dark" เท่านั้นถึงจะมืด
 * (ไม่อ่าน prefers-color-scheme ของเครื่อง ตามที่กำหนดให้ default เป็น light)
 */
const SCRIPT = `
try {
  if (localStorage.getItem("taskhub-theme") === "dark") {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}
`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
