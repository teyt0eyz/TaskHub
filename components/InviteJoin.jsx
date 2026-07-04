"use client";

import { signIn } from "next-auth/react";

export default function InviteJoin({ token, projectName }) {
  return (
    <div className="dot-grid flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,.06)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white">
          T
        </div>
        <h1 className="text-xl font-bold text-ink">You’ve been invited to join</h1>
        <p className="mt-1 text-lg font-semibold text-brand">{projectName || "Project"}</p>
        <p className="mt-2 text-sm text-ink-2">Sign in with Google to accept the invitation</p>
        <button
          onClick={() => signIn("google", { callbackUrl: `/invite/${token}` })}
          className="mt-6 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
