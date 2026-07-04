"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import EmailNotifyToggle from "@/components/EmailNotifyToggle";
import InviteButton from "@/components/InviteButton";
import CreateProjectButton from "@/components/CreateProjectButton";
import JoinCodeButton from "@/components/JoinCodeButton";
import RealtimeRefresher from "@/components/RealtimeRefresher";
import NotificationBell from "@/components/NotificationBell";
import VisibilityToggle from "@/components/VisibilityToggle";
import JoinModeToggle from "@/components/JoinModeToggle";
import DeleteProjectButton from "@/components/DeleteProjectButton";

function initialsOf(nameOrEmail = "") {
  const s = String(nameOrEmail).trim();
  if (!s) return "?";
  const parts = s.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

function NavRow({ item, active, open }) {
  const badge = item.badge > 0 ? item.badge : 0;
  return (
    <Link
      href={item.href}
      title={item.label}
      className={`flex items-center gap-2.5 rounded-[9px] px-2 py-[7px] transition-colors ${
        open ? "justify-start" : "justify-center"
      } ${active ? "bg-brand-soft" : "hover:bg-surface-2"}`}
    >
      <span
        className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base"
        style={{
          background: active ? item.color : "#F0F0F0",
          color: active ? "#fff" : "#5A5A5A",
        }}
      >
        {item.icon}
        {/* ตอนย่อ sidebar ไม่มีที่ให้ badge ด้านขวา จึงโชว์ที่มุมไอคอนแทน */}
        {!open && badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c1392b] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      {open && (
        <span
          className="flex-1 truncate text-[13.5px]"
          style={{ color: active ? "#1f7a45" : "#1C1C1C", fontWeight: active ? 600 : 500 }}
        >
          {item.label}
        </span>
      )}
      {open && badge > 0 && (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#c1392b] px-1.5 text-[11px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {open && active && badge === 0 && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
    </Link>
  );
}

export default function AppShell({ nav = [], title = "Project Alpha", roleLabel, isLeader = false, base = "/leader", projects = [], projectId, projectSettings = null, hideViewToggle = false, children }) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // ปิด drawer มือถืออัตโนมัติเมื่อเปลี่ยนหน้า
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function saveRename(e) {
    e.preventDefault();
    if (!renameVal.trim()) return;
    setRenameBusy(true);
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projectId, name: renameVal.trim() }),
    });
    setRenameBusy(false);
    if (res.ok) {
      setRenaming(false);
      router.refresh();
    } else {
      alert("Rename failed");
    }
  }
  const userName = session?.user?.name || session?.user?.email || "User";
  const userInitials = initialsOf(session?.user?.name || session?.user?.email);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Backdrop มือถือ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop: อยู่ในแถว, มือถือ: เป็น drawer เลื่อนจากซ้าย */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-white transition-[transform,width] duration-200 md:static md:z-30 md:shrink-0 md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:shadow-none"
        }`}
        style={{ width: open ? 232 : 68, padding: open ? "16px 12px" : "16px 8px" }}
      >
        <div className={`mb-3.5 flex items-center gap-2 ${open ? "justify-between" : "justify-center"}`}>
          {open && (
            <Link
              href={`${base}?all=1`}
              title="View all projects"
              className="flex items-center gap-2.5 overflow-hidden rounded-lg px-1 py-0.5 transition-colors hover:bg-surface-2"
            >
              <span className="font-heading whitespace-nowrap text-[15px] font-bold text-ink">Task<span style={{ color: "#6fcf97" }}>Hub</span></span>
            </Link>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            title={open ? "Collapse" : "Expand"}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-base text-ink-2 hover:bg-surface-2 md:flex"
          >
            {open ? "«" : "»"}
          </button>
          {/* ปุ่มปิด drawer (เฉพาะมือถือ) */}
          <button
            onClick={() => setMobileOpen(false)}
            title="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-ink-2 hover:bg-surface-2 md:hidden"
          >
            ✕
          </button>
        </div>

        {/* create project (leader) / join by code (member) — เหนือ project switcher */}
        {base === "/member" ? (
          <JoinCodeButton className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2 text-[13px] font-semibold text-ink-2 transition-colors hover:border-accent hover:text-accent">
            {open ? "🔑 Enter join code" : "🔑"}
          </JoinCodeButton>
        ) : (
          <CreateProjectButton className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2 text-[13px] font-semibold text-ink-2 transition-colors hover:border-brand hover:text-brand">
            {open ? <><span className="text-base leading-none">+</span> Create project</> : "+"}
          </CreateProjectButton>
        )}

        {/* project switcher — one account can have many projects */}
        {(() => {
          const current = projects.find((p) => p.id === projectId) || { name: title, initials: "P", color: "#2E9E5B" };
          if (!open) {
            return (
              <div className="mb-3 flex items-center justify-center rounded-xl py-2">
                <span
                  title={current.name}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                  style={{ background: current.color }}
                >
                  {current.initials}
                </span>
              </div>
            );
          }
          return (
            <div className="relative mb-3">
              <button
                onClick={() => setProjOpen((v) => !v)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-line px-2.5 py-2 text-left transition-colors hover:bg-surface-2"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                  style={{ background: current.color }}
                >
                  {current.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-ink-3">Projects</span>
                  <span className="block truncate text-[13px] font-semibold text-ink">{current.name}</span>
                </span>
                <span className="text-ink-3">{projOpen ? "▴" : "▾"}</span>
              </button>

              {projOpen && (
                <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,.1)]">
                  {projects.map((p) => (
                    <Link
                      key={p.id}
                      href={`${base}/${p.id}`}
                      onClick={() => setProjOpen(false)}
                      className={`flex items-center gap-2.5 px-2.5 py-2 hover:bg-surface-2 ${
                        p.id === projectId ? "bg-brand-soft" : ""
                      }`}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                        style={{ background: p.color }}
                      >
                        {p.initials}
                      </span>
                      <span className="truncate text-[13px] font-medium text-ink">{p.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* view switcher — the same account can act as Leader or Member (ซ่อนสำหรับรองหัวหน้า) */}
        {!hideViewToggle && (() => {
          const view = pathname.startsWith("/member") ? "member" : "leader";
          const views = [
            { key: "leader", href: "/leader", label: "Leader" },
            { key: "member", href: "/member", label: "Member" },
          ];
          return open ? (
            <div className="mb-4 flex rounded-xl bg-surface-2 p-1">
              {views.map((v) => (
                <Link
                  key={v.key}
                  href={v.href}
                  className={`flex flex-1 items-center justify-center rounded-lg py-1.5 text-[13px] font-semibold transition-all ${
                    view === v.key ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {v.label}
                </Link>
              ))}
            </div>
          ) : (
            <div className="mb-4 flex flex-col gap-1">
              {views.map((v) => (
                <Link
                  key={v.key}
                  href={v.href}
                  title={`${v.label} view`}
                  className={`flex items-center justify-center rounded-lg py-2 text-sm font-bold transition-all ${
                    view === v.key ? "bg-white text-ink shadow-sm ring-1 ring-line" : "text-ink-3 hover:text-ink"
                  }`}
                >
                  {v.label[0]}
                </Link>
              ))}
            </div>
          );
        })()}

        {open && (
          <div className="mx-1.5 mb-2 mt-1 text-[10.5px] font-semibold tracking-wider text-ink-3">
            MENU
          </div>
        )}

        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              open={open}
              active={pathname === item.href || (item.href !== nav[0].href && pathname.startsWith(item.href))}
            />
          ))}
        </nav>

      </aside>

      {/* Right column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="z-20 flex h-[60px] shrink-0 items-center gap-4 border-b border-line bg-white/85 px-4 backdrop-blur sm:px-5">
          <button
            onClick={() => setMobileOpen(true)}
            title="Menu"
            className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-ink-2 hover:bg-surface-2 md:hidden"
          >
            ☰
          </button>
          <div className="relative flex min-w-0 items-center gap-1.5">
            {/* Project nameซ่อนบนมือถือ (ดูจาก sidebar ผ่าน hamburger แทน) */}
            <span className="font-heading hidden truncate px-1.5 py-1 text-[15px] font-semibold text-ink md:block">
              {title}
            </span>
            {isLeader && (
              <button
                onClick={() => {
                  setRenameVal(title);
                  setRenaming(true);
                }}
                title="Rename project"
                className="hidden text-ink-3 hover:text-brand md:inline"
              >
                ✎
              </button>
            )}
            {roleLabel && (
              <span className="ml-1 rounded-md bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                {roleLabel}
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3.5">
            <NotificationBell />
            {projectId && projectSettings && (
              <button
                onClick={() => setSettingsOpen(true)}
                title="Project settings"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.041.147.083.22.127.324.196.72.257 1.076.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.004.827c-.292.24-.437.613-.43.992a7.723 7.723 0 0 1 0 .255c-.007.378.138.75.43.991l1.005.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.073-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button>
            )}
            {isLeader && projectId && (
              <InviteButton
                projectId={projectId}
                triggerLabel="Share"
                triggerClassName="rounded-[9px] border-[1.5px] border-brand bg-white px-4 py-[7px] text-[13px] font-semibold text-brand hover:bg-brand-soft"
              />
            )}

            {/* current user + sign out */}
            <div className="relative">
              <button
                onClick={() => setUserMenu((v) => !v)}
                title={userName}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-dark"
              >
                {userInitials}
              </button>
              {userMenu && (
                <div className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,.1)]">
                  <div className="truncate border-b border-line px-3 py-2 text-[13px] font-semibold text-ink">
                    {userName}
                  </div>
                  <EmailNotifyToggle />
                  <div className="my-1 border-t border-line" />
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
        </header>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>

      {/* อัปเดตกิ่ง/ข้อมูลแบบ realtime โดยไม่ต้อง refresh เอง */}
      <RealtimeRefresher projectId={projectId} />

      {/* project settings modal */}
      {settingsOpen && projectSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setSettingsOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="scroll-soft max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">⚙️ Project settings</h2>
              <button onClick={() => setSettingsOpen(false)} className="text-ink-3 hover:text-ink">✕</button>
            </div>
            <VisibilityToggle projectId={projectId} value={projectSettings.member_visibility || "own"} />
            <JoinModeToggle projectId={projectId} value={!!projectSettings.auto_approve} />
            {isLeader && <DeleteProjectButton projectId={projectId} projectName={title} />}
          </div>
        </div>
      )}

      {/* rename project modal */}
      {renaming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setRenaming(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={saveRename} className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ink">Rename project</h2>
            <input
              autoFocus
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              className="mt-4 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setRenaming(false)} className="rounded-[10px] border border-line px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2">
                Cancel
              </button>
              <button type="submit" disabled={renameBusy} className="rounded-[10px] bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                {renameBusy ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
