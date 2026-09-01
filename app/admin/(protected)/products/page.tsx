import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, type Product } from "@/lib/types";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { FeatureToggle } from "@/components/admin/FeatureToggle";

export default async function AdminProductsPage() {
  const supabase = createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow mb-2">Catalog</p>
          <h1 className="font-display text-3xl text-bone">Products</h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/products/import"
            className="border border-white/20 px-5 py-2.5 font-mono text-[11px] uppercase tracking-eyebrow text-bone/70 hover:border-gold hover:text-gold"
          >
            Import CSV
          </Link>
          <Link
            href="/admin/products/new"
            className="border border-gold bg-gold px-5 py-2.5 font-mono text-[11px] uppercase tracking-eyebrow text-void hover:bg-transparent hover:text-gold"
          >
            + New Product
          </Link>
        </div>
      </div>

      <div className="mt-8 border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">
              <th className="p-4">Title</th>
              <th className="p-4">Status</th>
              <th className="p-4">Price</th>
              <th className="p-4">Featured</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {(products as Product[] | null)?.map((product) => (
              <tr key={product.id} className="border-b border-white/5">
                <td className="p-4">
                  <p className="text-bone">{product.title}</p>
                  <p className="text-xs text-bone/40">{product.slug}</p>
                </td>
                <td className="p-4">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-eyebrow ${
                      product.status === "published"
                        ? "text-gold"
                        : "text-bone/40"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="p-4 font-mono text-bone/70">
                  {formatPrice(product.price_cents)}
                </td>
                <td className="p-4">
                  <FeatureToggle
                    productId={product.id}
                    isFeatured={product.is_featured}
                  />
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-4">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/60 hover:text-gold"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton productId={product.id} />
                  </div>
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-bone/40">
                  No products yet — create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
