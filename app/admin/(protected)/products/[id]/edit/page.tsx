import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProduct, deleteProductFile } from "@/lib/actions/products";
import { getSignedCoverUrl } from "@/lib/r2/storage";
import { ProductForm } from "@/components/admin/ProductForm";
import { CoverImageUpload } from "@/components/admin/CoverImageUpload";
import { ProductFilesManager } from "@/components/admin/ProductFilesManager";
import type { Category, Product } from "@/lib/types";

interface Props {
  params: { id: string };
}

export default async function EditProductPage({ params }: Props) {
  const supabase = createClient();

  const [{ data: product }, { data: categories }, { data: files }, { data: unassignedFiles }] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", params.id).maybeSingle(),
      supabase.from("categories").select("*").order("sort_order"),
      supabase
        .from("product_files")
        .select("*")
        .eq("product_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("product_files")
        .select("id, file_name, file_type, file_size_bytes")
        .is("product_id", null)
        .order("created_at", { ascending: false }),
    ]);

  if (!product) notFound();

  const boundAction = updateProduct.bind(null, params.id);
  const coverUrl = await getSignedCoverUrl(product.cover_image_key);

  return (
    <div>
      <p className="eyebrow mb-2">Catalog</p>
      <h1 className="mb-8 font-display text-3xl text-bone">
        Edit — {product.title}
      </h1>

      <div className="mb-10 max-w-2xl space-y-8 border border-white/10 bg-charcoal p-6">
        <CoverImageUpload productId={product.id} currentCoverUrl={coverUrl} />
        <ProductFilesManager
          productId={product.id}
          files={files ?? []}
          unassignedFiles={unassignedFiles ?? []}
          onDelete={deleteProductFile}
        />
      </div>

      <ProductForm
        action={boundAction}
        categories={(categories ?? []) as Category[]}
        product={product as Product}
      />
    </div>
  );
}
