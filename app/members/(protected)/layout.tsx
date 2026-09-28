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
      <header className="glass-panel sticky top-0 z-50 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/members/library" className="flex items-center gap-2.5">
            <SealMark className="h-6 w-6 text-gold" />
            <span className="font-display text-sm tracking-wide">KAIZEN MEMBERS</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-5">
            <Link href="/members/library" className="rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-bone/60 transition hover:bg-white/5 hover:text-gold">
              Library
            </Link>
            <Link href="/members/account" className="rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-bone/60 transition hover:bg-white/5 hover:text-gold">
              Account
            </Link>
            <Link href="/" className="hidden rounded-full border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-bone/60 transition hover:border-gold/40 hover:text-gold sm:inline-flex">
              Store
            </Link>
            <form action={memberLogoutAction}>
              <button className="rounded-full border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40 transition hover:border-crimson/40 hover:text-bone">
                Sign Out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
