import Link from "next/link";
import { SealMark } from "./SealMark";

const COLUMNS = [
  {
    heading: "Shop",
    links: [
      { label: "All Products", href: "/collections/all" },
      { label: "Custom Request", href: "/custom-request" },
      { label: "Software", href: "/collections/software" },
    ],
  },
  {
    heading: "Collections",
    links: [
      { label: "Attraction", href: "/collections/attraction" },
      { label: "Self Improvement", href: "/collections/self-improvement" },
      { label: "Lifestyle", href: "/collections/lifestyle" },
    ],
  },
  {
    heading: "Information",
    links: [
      { label: "About Us", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative bg-charcoal">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-burgundy-wash" />
      <div className="relative mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-3">
              <SealMark className="h-6 w-6 text-gold" />
              <span className="font-display text-base tracking-wide">KAIZEN</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-bone/50">
              Precision-engineered subliminal audio and software. Built for a
              deliberate mind.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="eyebrow mb-4">{col.heading}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-bone/60 transition-colors hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="eyebrow mb-4">Newsletter</p>
            <p className="mb-4 text-sm text-bone/50">
              Stay informed on new releases.
            </p>
            <form className="flex border border-white/15">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-bone placeholder:text-bone/30 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="px-4 text-gold transition-colors hover:bg-gold hover:text-void"
              >
                →
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-bone/40 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Kaizen. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-gold">Terms</Link>
            <Link href="/privacy" className="hover:text-gold">Privacy</Link>
            <Link href="/cookies" className="hover:text-gold">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
