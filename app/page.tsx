import { createClient } from "@/lib/supabase/server";
import { resolveCoverUrls } from "@/lib/r2/resolve-covers";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedSection } from "@/components/FeaturedSection";
import { CategoryTabsSection } from "@/components/CategoryTabsSection";
import { Footer } from "@/components/Footer";
import type {

  Category,
  HomepageFeaturedPanel,
  HomepageHero,
  Product,
} from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;


const FALLBACK_HERO: HomepageHero = {
  title: "Kaizen",
  subtitle: "Precision-engineered audio for a deliberate mind.",
  description: "",
  primary_cta_label: "Explore Subliminals",
  secondary_cta_label: "Learn More",
};

const FALLBACK_PANEL: HomepageFeaturedPanel = {
  title: "Featured Collection",
  description: "",
};

export default async function HomePage() {
  const supabase = createClient();

  const [{ data: categories }, { data: products }, { data: featuredProducts }, { data: content }] =
    await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase
        .from("products")
        .select("*")
        .eq("status", "published")
        .order("sort_order")
        .limit(24),
      // Queried directly rather than filtered from the capped list above —
      // every imported product shares sort_order=0, so Postgres returns
      // that tie in an unstable order and a featured product could fall
      // outside the first 24 by chance, silently emptying this section.
      supabase
        .from("products")
        .select("*")
        .eq("status", "published")
        .eq("is_featured", true)
        .order("sort_order")
        .limit(6),
      supabase.from("homepage_content").select("*"),
    ]);

  const heroRow = content?.find((c) => c.key === "hero");
  const panelRow = content?.find((c) => c.key === "featured_panel");

  const hero: HomepageHero = heroRow?.value ?? FALLBACK_HERO;
  const panel: HomepageFeaturedPanel = panelRow?.value ?? FALLBACK_PANEL;

  const allProducts = (products ?? []) as Product[];
  const featured = (featuredProducts ?? []) as Product[];
  const allCategories = (categories ?? []) as Category[];
  const coverUrls = await resolveCoverUrls([
    ...allProducts,
    ...featured.filter((f) => !allProducts.some((p) => p.id === f.id)),
  ]);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kaizen Subliminals",
    url: "https://kaizensubliminals.store",
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Kaizen Subliminals",
    url: "https://kaizensubliminals.store",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://kaizensubliminals.store/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Header />
      <main>
        <Hero content={hero} />
        <FeaturedSection panel={panel} products={featured} coverUrls={coverUrls} />
        <CategoryTabsSection
          categories={allCategories}
          products={allProducts}
          coverUrls={coverUrls}
        />
      </main>
      <Footer />
    </>
  );
}
