import { createClient } from "@/lib/supabase/server";
import { createCategory, deleteCategory } from "@/lib/actions/categories";
import { DeleteCategoryButton } from "@/components/admin/DeleteCategoryButton";
import type { Category } from "@/lib/types";

export default async function AdminCategoriesPage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <p className="eyebrow mb-2">Catalog</p>
      <h1 className="mb-8 font-display text-3xl text-bone">Categories</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">
                <th className="p-4">Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {(categories as Category[] | null)?.map((cat) => (
                <tr key={cat.id} className="border-b border-white/5">
                  <td className="p-4 text-bone">{cat.name}</td>
                  <td className="p-4 font-mono text-bone/50">{cat.slug}</td>
                  <td className="p-4 text-right">
                    <DeleteCategoryButton
                      categoryId={cat.id}
                      onDelete={deleteCategory}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <p className="eyebrow mb-4">New Category</p>
          <form action={createCategory} className="space-y-4">
            <input
              name="name"
              placeholder="Name"
              required
              className="w-full border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-gold"
            />
            <input
              name="slug"
              placeholder="slug-like-this"
              required
              className="w-full border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-gold"
            />
            <textarea
              name="description"
              placeholder="Description (optional)"
              rows={3}
              className="w-full border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="w-full border border-gold bg-gold py-2.5 font-mono text-[11px] uppercase tracking-eyebrow text-void hover:bg-transparent hover:text-gold"
            >
              Add Category
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
