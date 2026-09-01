import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function InfoPageLayout({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="pt-24">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:px-0">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h1 className="mb-10 font-display text-4xl text-bone">{title}</h1>
          <div className="space-y-6 text-sm leading-relaxed text-bone/70 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-bone [&_a]:text-gold [&_a]:underline [&_a]:underline-offset-2">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
