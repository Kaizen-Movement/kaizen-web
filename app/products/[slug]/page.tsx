import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSignedCoverUrl } from "@/lib/r2/storage";
import { resolveCoverUrls } from "@/lib/r2/resolve-covers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SealMark } from "@/components/SealMark";
import { ProductCard } from "@/components/ProductCard";
import { AddToCartButton } from "@/components/AddToCartButton";
import { FaqAccordion } from "@/components/FaqAccordion";
import { formatPrice, type Product } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;



interface Props {
  params: { slug: string };
}

async function getProduct(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data as Product | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return {};

  const url = `https://kaizensubliminals.store/products/${product.slug}`;
  const ogImage = `https://kaizensubliminals.store/api/og/${product.slug}`;

  return {
    title: product.title,
    description: product.short_description ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title: product.title,
      description: product.short_description ?? undefined,
      url,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 1200 }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.short_description ?? undefined,
      images: [ogImage],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const supabase = createClient();
  const { data: related } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .eq("category_id", product.category_id ?? "")
    .neq("id", product.id)
    .limit(4);

  const defaultFaq =
    product.kind === "software"
      ? [
          {
            question: "How do I access the software after purchase?",
            answer:
              "You'll receive an email with a link to your Download Centre immediately after payment, where the installer or files are available.",
          },
          {
            question: "Is there a license limit?",
            answer:
              "Each purchase includes a personal-use license. See the product description above for specifics on this title.",
          },
        ]
      : [
          {
            question: "How should I listen?",
            answer:
              "Most people listen with headphones, either actively or as background audio during focused or restful time. There's no single required method.",
          },
          {
            question: "How long until I have access?",
            answer:
              "Your download link is generated the moment payment completes and is available from your Download Centre.",
          },
        ];

  const faqItems = product.faq?.length ? product.faq : defaultFaq;

  let coverUrl: string | null = null;
  try {
    coverUrl = await getSignedCoverUrl(product.cover_image_key);
  } catch {
    coverUrl = null;
  }
  const relatedCoverUrls = await resolveCoverUrls((related ?? []) as Product[]);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.short_description ?? product.long_description ?? undefined,
    image: `https://kaizensubliminals.store/api/og/${product.slug}`,
    sku: product.slug,
    offers: {
      "@type": "Offer",
      url: `https://kaizensubliminals.store/products/${product.slug}`,
      priceCurrency: "USD",
      price: (product.price_cents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Header />
      <main className="pt-24">
        <div className="mx-auto max-w-[1440px] px-6 py-4 lg:px-10">
          <nav className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/40">
            <Link href="/" className="hover:text-gold">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/collections/all" className="hover:text-gold">Collections</Link>
            <span className="mx-2">/</span>
            <span className="text-bone/70">{product.title}</span>
          </nav>
        </div>

        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-6 pb-16 lg:grid-cols-2 lg:px-10">
          {/* Artwork */}
          <div className="relative flex aspect-square w-full items-center justify-center border border-white/10 bg-charcoal">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={product.title}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <SealMark className="h-32 w-32 text-gold/20" />
            )}
          </div>

          {/* Info */}
          <div>
            <p className="eyebrow mb-3">
              {product.kind === "software" ? "Software" : "Subliminal Audio"}
            </p>
            <h1 className="font-display text-4xl text-bone md:text-5xl">
              {product.title}
            </h1>
            {product.short_description && (
              <p className="mt-4 text-base text-bone/60">
                {product.short_description}
              </p>
            )}

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-mono text-2xl text-gold">
                {formatPrice(product.price_cents)}
              </span>
              {product.compare_at_price_cents && (
                <span className="font-mono text-sm text-bone/30 line-through">
                  {formatPrice(product.compare_at_price_cents)}
                </span>
              )}
            </div>

            <div className="mt-8">
              <AddToCartButton product={product} />
            </div>

            {product.long_description && (
              <p className="mt-10 text-sm leading-relaxed text-bone/60">
                {product.long_description}
              </p>
            )}

            {product.benefits?.length > 0 && (
              <div className="mt-10">
                <p className="eyebrow mb-4">Benefits</p>
                <ul className="space-y-2">
                  {product.benefits.map((b, i) => (
                    <li key={i} className="flex gap-3 text-sm text-bone/70">
                      <span className="text-gold">—</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.whats_included?.length > 0 && (
              <div className="mt-8">
                <p className="eyebrow mb-4">What&apos;s Included</p>
                <ul className="space-y-2">
                  {product.whats_included.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-bone/70">
                      <span className="text-gold">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.how_it_works && (
              <div className="mt-8">
                <p className="eyebrow mb-4">How It Works</p>
                <p className="text-sm leading-relaxed text-bone/60">
                  {product.how_it_works}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FAQ */}
        <section className="mx-auto max-w-2xl px-6 pb-20 lg:px-10">
          <p className="eyebrow mb-6">Frequently Asked Questions</p>
          <FaqAccordion items={faqItems} />
        </section>

        {/* Recommended */}
        {related && related.length > 0 && (
          <section className="border-t border-white/10 bg-charcoal">
            <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
              <p className="eyebrow mb-6">Customers Also Viewed</p>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {(related as Product[]).map((p) => (
                  <ProductCard key={p.id} product={p} coverUrl={relatedCoverUrls[p.id] ?? null} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
