export type ProductKind = "subliminal" | "software";
export type ProductStatus = "draft" | "published" | "archived";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  kind: ProductKind;
  category_id: string | null;
  short_description: string | null;
  long_description: string | null;
  benefits: string[];
  whats_included: string[];
  how_it_works: string | null;
  faq: { question: string; answer: string }[];
  price_cents: number;
  compare_at_price_cents: number | null;
  cover_image_key: string | null;
  gallery_image_keys: string[];
  status: ProductStatus;
  is_featured: boolean;
  is_recommended: boolean;
  sort_order: number;
}

export interface HomepageHero {
  title: string;
  subtitle: string;
  description: string;
  primary_cta_label: string;
  secondary_cta_label: string;
}

export interface HomepageFeaturedPanel {
  title: string;
  description: string;
}

export const formatPrice = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    cents / 100
  );
