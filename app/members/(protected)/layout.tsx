import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { memberLogoutAction } from "@/lib/actions/member-auth";
import { SealMark } from "@/components/SealMark";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/members/login");

  return (
    <div className="min-h-screen bg-void text-bone">
      {/* Top nav bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-void/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/members/library" className="flex items-center gap-2">
            <SealMark className="h-6 w-6 text-gold" />
            <span className="font-display text-sm tracking-wide">MY LIBRARY</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/members/library"
              className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/60 transition-colors hover:text-gold"
            >
              Library
            </Link>
            <Link
              href="/members/account"
              className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/60 transition-colors hover:text-gold"
            >
              Account
            </Link>
            <Link
              href="/"
              className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/60 transition-colors hover:text-gold"
            >
              Store
            </Link>
            <form action={memberLogoutAction}>
              <button className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/40 hover:text-gold">
                Sign Out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
