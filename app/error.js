"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,.06)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(193,57,43,.1)] text-3xl">
          😵
        </div>
        <h2 className="text-lg font-bold text-ink">Something went wrong</h2>
        <p className="mt-1.5 text-sm text-ink-2">
          We hit a temporary problem. Try again or refresh the page.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-[10px] bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-[10px] border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-surface-2"
          >
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
