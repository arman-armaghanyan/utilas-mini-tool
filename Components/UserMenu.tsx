"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (status === "unauthenticated") {
    return (
      <Link
        href="/login"
        className="transition hover:text-zinc-900"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <Link
        href="/admin"
        className="transition hover:text-zinc-900"
        prefetch={false}
      >
        EditTool
      </Link>
      <div className="flex items-center gap-4 border-l border-zinc-200 pl-6">
        <span className="text-xs text-zinc-500 hidden sm:inline">
          {session?.user?.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

