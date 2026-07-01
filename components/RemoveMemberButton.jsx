"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemoveMemberButton({ projectId, userId, name }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`ลบ ${name} ออกจากโปรเจกต์?`)) return;
    setBusy(true);
    const res = await fetch("/api/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, user_id: userId }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "ลบไม่สำเร็จ");
    }
  }

  return (
    <button
      onClick={remove}
      disabled={busy}
      title="ลบสมาชิกออก"
      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-ink-3 hover:bg-[rgba(193,57,43,.08)] hover:text-[#c1392b] disabled:opacity-50"
    >
      🗑
    </button>
  );
}
