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
    <header className="glass-panel fixed top-0 left-0 right-0 z-50 border-x-0 border-t-0">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <SealMark className="h-7 w-7 text-gold" />
          <span className="font-display text-lg tracking-wide">
            KAIZEN
          </span>
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
        </nav>

        <div className="flex items-center gap-5">
          <Link href="/search" aria-label="Search" className="text-bone/80 transition-colors hover:text-gold">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.2" />
              <line x1="12.6" y1="12.6" x2="17" y2="17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative text-bone/80 transition-colors hover:text-gold">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 5h12l-1 9H4L3 5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M6 5V4a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
