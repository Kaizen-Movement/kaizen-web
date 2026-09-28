import Link from "next/link";
import { SealMark } from "./SealMark";

const NAV_LINKS = [
  { label: "Attraction", href: "/collections/attraction" },
  { label: "Self Improvement", href: "/collections/self-improvement" },
  { label: "Lifestyle", href: "/collections/lifestyle" },
  { label: "Software", href: "/collections/software" },
  { label: "Custom Request", href: "/custom-request" },
  { label: "About", href: "/about" },
];

export function Header() {
  return (
    <header className="glass-panel fixed left-0 right-0 top-0 z-50 border-x-0 border-t-0">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <SealMark className="h-7 w-7 text-gold" />
          <span className="font-display text-lg tracking-wide">KAIZEN</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/70 transition-colors hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/members/login"
            className="rounded-full border border-gold/30 bg-white/[0.03] px-4 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-gold transition hover:border-gold/60 hover:bg-gold/10"
          >
            Member Access
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <details className="relative lg:hidden">
            <summary
              aria-label="Open navigation"
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/10 text-bone/80 transition hover:border-gold/40 hover:text-gold [&::-webkit-details-marker]:hidden"
            >
              <span className="sr-only">Open navigation</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="absolute right-0 top-12 w-64 rounded-2xl border border-white/10 bg-charcoal/95 p-2 shadow-depth-lg backdrop-blur-xl">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-xl px-4 py-3 font-mono text-[10px] uppercase tracking-eyebrow text-bone/70 transition hover:bg-white/5 hover:text-gold"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/members/login"
                className="mt-1 block rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 font-mono text-[10px] uppercase tracking-eyebrow text-gold"
              >
                Member Access
              </Link>
            </div>
          </details>

          <Link href="/search" aria-label="Search" className="text-bone/80 transition-colors hover:text-gold">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.2" />
              <line x1="12.6" y1="12.6" x2="17" y2="17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative text-bone/80 transition-colors hover:text-gold">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 5h12l-1 9H4L3 5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M6 5V4a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
