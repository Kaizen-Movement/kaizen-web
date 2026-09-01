import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { resolveCoverUrls } from "@/lib/r2/resolve-covers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import type { Category, Product } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;



interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const url = `https://kaizensubliminals.store/collections/${params.slug}`;
  if (params.slug === "all") {
    return { title: "All Products", alternates: { canonical: url } };
  }
  const supabase = createClient();
  const { data } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", params.slug)
    .maybeSingle();
  return {
    title: data?.name ?? "Collection",
    description: data?.description ?? undefined,
    alternates: { canonical: url },
  };
}

export default async function CollectionPage({ params }: Props) {
  const supabase = createClient();

  let category: Category | null = null;
  let products: Product[] = [];

  if (params.slug === "all") {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("status", "published")
      .order("sort_order");
    products = (data ?? []) as Product[];
  } else {
    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", params.slug)
      .maybeSingle();
    category = catData as Category | null;

    if (category) {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("status", "published")
        .eq("category_id", category.id)
        .order("sort_order");
      products = (data ?? []) as Product[];
    }
  }

  const title = params.slug === "all" ? "All Products" : category?.name ?? "Collection";
  const coverUrls = await resolveCoverUrls(products);

  return (
    <>
      <Header />
      <main className="pt-24">
        <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
          <p className="eyebrow mb-3">Collection</p>
          <h1 className="font-display text-5xl text-bone">{title}</h1>
          {category?.description && (
            <p className="mt-4 max-w-lg text-sm text-bone/60">
              {category.description}
            </p>
          )}
        </div>

        <div className="mx-auto max-w-[1440px] px-6 pb-20 lg:px-10">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} coverUrl={coverUrls[product.id] ?? null} />
              ))}
            </div>
          ) : (
            <p className="py-20 text-center text-sm text-bone/40">
              New pieces for this collection are in progress.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
