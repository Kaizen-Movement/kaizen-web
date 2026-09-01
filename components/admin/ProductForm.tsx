"use client";

import { useFormState } from "react-dom";
import type { ProductFormState } from "@/lib/actions/products";
import type { Category, Product } from "@/lib/types";

const initialState: ProductFormState = {};

export function ProductForm({
  action,
  categories,
  product,
}: {
  action: (
    prevState: ProductFormState,
    formData: FormData
  ) => Promise<ProductFormState>;
  categories: Category[];
  product?: Product;
}) {
  const [state, formAction] = useFormState(action, initialState);

  const inputClass =
    "w-full border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-gold";
  const labelClass =
    "mb-1 block font-mono text-[11px] uppercase tracking-eyebrow text-bone/50";

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Title</label>
          <input
            name="title"
            required
            defaultValue={product?.title}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Slug</label>
          <input
            name="slug"
            required
            defaultValue={product?.slug}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Kind</label>
          <select
            name="kind"
            defaultValue={product?.kind ?? "subliminal"}
            className={inputClass}
          >
            <option value="subliminal">Subliminal</option>
            <option value="software">Software</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select
            name="category_id"
            defaultValue={product?.category_id ?? ""}
            className={inputClass}
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Short Description</label>
        <input
          name="short_description"
          defaultValue={product?.short_description ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Long Description</label>
        <textarea
          name="long_description"
          rows={4}
          defaultValue={product?.long_description ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Benefits (one per line)</label>
        <textarea
          name="benefits"
          rows={4}
          defaultValue={product?.benefits?.join("\n")}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>What&apos;s Included (one per line)</label>
        <textarea
          name="whats_included"
          rows={4}
          defaultValue={product?.whats_included?.join("\n")}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>How It Works</label>
        <textarea
          name="how_it_works"
          rows={3}
          defaultValue={product?.how_it_works ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Price (USD)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={
              product ? (product.price_cents / 100).toFixed(2) : ""
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            name="status"
            defaultValue={product?.status ?? "draft"}
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-eyebrow text-bone/60">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={product?.is_featured}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-eyebrow text-bone/60">
          <input
            type="checkbox"
            name="is_recommended"
            defaultChecked={product?.is_recommended}
          />
          Recommended
        </label>
      </div>

      {state.error && <p className="text-sm text-crimson">{state.error}</p>}

      <button
        type="submit"
        className="border border-gold bg-gold px-6 py-3 font-mono text-[11px] uppercase tracking-eyebrow text-void hover:bg-transparent hover:text-gold"
      >
        {product ? "Save Changes" : "Create Product"}
      </button>
    </form>
  );
}
