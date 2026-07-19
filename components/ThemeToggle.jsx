"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "taskhub-theme";

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export default function ThemeToggle() {
  // เริ่มที่ light เสมอ แล้วค่อย sync กับค่าที่บันทึกไว้หลัง mount
  // (server ไม่รู้ค่าใน localStorage — ถ้าเดาจะ hydration mismatch)
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {}
    setTheme(saved === "dark" ? "dark" : "light");
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface-2"
    >
      <span className="flex items-center gap-2">
        <span aria-hidden>{isDark ? "🌙" : "☀️"}</span>
        {isDark ? "Dark mode" : "Light mode"}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${isDark ? "bg-brand" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            isDark ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
