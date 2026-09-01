import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { SealMark } from "@/components/SealMark";

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Products", href: "/admin/products" },
  { label: "Bulk Upload", href: "/admin/bulk-upload" },
  { label: "Media Library", href: "/admin/media" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Abandoned Checkouts", href: "/admin/abandoned-checkouts" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Memberships", href: "/admin/memberships" },
  { label: "Homepage", href: "/admin/homepage" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void px-6 text-center text-bone">
        <div>
          <p className="font-display text-2xl">Not authorized</p>
          <p className="mt-2 text-sm text-bone/50">
            Your account ({user.email}) isn&apos;t registered as a Kaizen admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-bone">
      <div className="flex">
        <aside className="sticky top-0 h-screen w-56 shrink-0 border-r border-white/10 p-6">
          <Link href="/admin" className="flex items-center gap-2">
            <SealMark className="h-6 w-6 text-gold" />
            <span className="font-display text-sm tracking-wide">ADMIN</span>
          </Link>
          <nav className="mt-10 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 font-mono text-[11px] uppercase tracking-eyebrow text-bone/60 transition-colors hover:bg-charcoal hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction} className="mt-10">
            <button className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/40 hover:text-gold">
              Sign Out
            </button>
          </form>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
