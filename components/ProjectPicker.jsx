"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import JoinCodeButton from "@/components/JoinCodeButton";
import ProjectCardMenu from "@/components/ProjectCardMenu";

function ViewToggle({ base }) {
  const views = [
    { key: "leader", href: "/leader?all=1", label: "Leader" },
    { key: "member", href: "/member?all=1", label: "Member" },
  ];
  const active = base === "/member" ? "member" : "leader";
  return (
    <div className="flex rounded-xl bg-surface-2 p-1">
      {views.map((v) => (
        <Link
          key={v.key}
          href={v.href}
          className={`flex items-center rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all ${
            active === v.key ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink"
          }`}
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}

export default function ProjectPicker({ base, projects = [] }) {
  const isLeader = base === "/leader";
  const router = useRouter();
  const { data: session } = useSession();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const userRef = useRef(null);

  const userName = session?.user?.name || session?.user?.email || "User";
  const initials = (session?.user?.name || session?.user?.email || "?").slice(0, 2).toUpperCase();

  useEffect(() => {
    function onDoc(e) {
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenu(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function createProject(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      const { project } = await res.json();
      router.push(`/leader/${project.id}`); // ผู้สร้างเป็น leader เสมอ
    } else {
      alert("Failed to create project");
    }
  }

  return (
    <div className="dot-grid min-h-screen">
      <header className="border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5 select-none">
            <span className="font-heading text-xl font-bold tracking-tight text-ink">TaskHub</span>
          </div>
          <div className="flex items-center gap-4">
            <ViewToggle base={base} />
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserMenu((v) => !v)}
                title={userName}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-dark"
              >
                {initials}
              </button>
              {userMenu && (
                <div className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,.1)]">
                  <div className="truncate border-b border-line px-3 py-2 text-[13px] font-semibold text-ink">{userName}</div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-ink-2 hover:bg-surface-2"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Choose a project</h1>
          <p className="mt-1 text-ink-2">
            {isLeader
              ? "Choose a project you lead, or create a new one"
              : "Choose a project you’re a member of"}
          </p>
        </div>

        {projects.length === 0 && !isLeader && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line bg-white/60 p-10 text-center">
            <div className="text-4xl">🙋</div>
            <div className="text-ink-2">You haven’t joined any project yet — enter a code or invite link from a leader to join</div>
            <JoinCodeButton className="rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#f55e1d]">
              🔑 Enter join code
            </JoinCodeButton>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="relative">
              {p.myRole === "leader" && <ProjectCardMenu projectId={p.id} projectName={p.name} />}
              <Link
                href={`${base}/${p.id}`}
                className="group flex flex-col rounded-2xl border border-line bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.05)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,.10)]"
              >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ background: p.color }}
                >
                  {p.initials}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-ink">{p.name}</div>
                  <div className="truncate text-xs text-ink-3">{p.desc || "—"}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-ink-2">
                {isLeader ? (
                  <>
                    <span>👥 {p.memberCount} members</span>
                    <span>🗂 {p.taskCount} tasks</span>
                  </>
                ) : (
                  <>
                    <span>👑 {p.leaderName}</span>
                    <span>🗂 {p.taskCount} tasks</span>
                  </>
                )}
              </div>
              <span
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-transform group-hover:translate-x-1"
                style={{ color: p.color }}
              >
                Open project →
              </span>
              </Link>
            </div>
          ))}

          {isLeader && (
            <button
              onClick={() => setCreating(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white/50 p-5 text-ink-3 transition-colors hover:border-brand hover:text-brand"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-current text-2xl">
                +
              </span>
              <span className="text-sm font-semibold">New project</span>
            </button>
          )}

          {!isLeader && projects.length > 0 && (
            <JoinCodeButton className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white/50 p-5 text-ink-3 transition-colors hover:border-accent hover:text-accent">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-current text-2xl">
                +
              </span>
              <span className="text-sm font-semibold">Join with a code</span>
            </JoinCodeButton>
          )}
        </div>
      </main>

      {/* create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setCreating(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={createProject}
            className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold text-ink">New project</h2>
            <p className="mt-1 text-sm text-ink-2">You’ll be the leader of this project</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="mt-4 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded-[10px] border border-line px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-[10px] bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {busy ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
