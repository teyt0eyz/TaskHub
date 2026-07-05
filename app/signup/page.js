"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import AuthShell, { Field, SubmitButton } from "@/components/AuthShell";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) return setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    if (password !== confirm) return setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      return setError(data.error || "สมัครไม่สำเร็จ");
    }

    // สมัครสำเร็จ → ล็อกอินเข้าเลยอัตโนมัติ
    const login = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (login?.error) {
      // เผื่อกรณีไม่คาดคิด — ส่งไปหน้า login ให้เข้าเอง
      window.location.href = "/login";
      return;
    }
    window.location.href = "/leader";
  }

  return (
    <AuthShell
      title="สร้างบัญชีใหม่"
      subtitle="สมัครด้วยอีเมลเพื่อเริ่มใช้ TaskHub"
      footer={
        <>
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
            เข้าสู่ระบบ
          </Link>
        </>
      }
    >
      <form onSubmit={handleSignup} className="mt-7 space-y-4">
        <Field
          label="ชื่อ"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อที่จะแสดงในทีม"
        />
        <Field
          label="อีเมล"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Field
          label="รหัสผ่าน"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="อย่างน้อย 8 ตัวอักษร"
        />
        <Field
          label="ยืนยันรหัสผ่าน"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="พิมพ์รหัสผ่านอีกครั้ง"
        />

        {error && (
          <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent">{error}</p>
        )}

        <SubmitButton type="submit" loading={loading}>
          สมัครสมาชิก
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
