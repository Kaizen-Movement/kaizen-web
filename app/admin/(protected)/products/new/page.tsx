import { createClient } from "@/lib/supabase/server";
import { createProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/ProductForm";
import type { Category } from "@/lib/types";

export default async function NewProductPage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <p className="eyebrow mb-2">Catalog</p>
      <h1 className="mb-8 font-display text-3xl text-bone">New Product</h1>
      <ProductForm action={createProduct} categories={(categories ?? []) as Category[]} />
    </div>
  );
}
