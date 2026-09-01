import { createClient } from "@/lib/supabase/server";
import { BulkAudioUploader } from "@/components/admin/BulkAudioUploader";

export default async function BulkUploadPage() {
  const supabase = createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, title, slug, kind, status")
    .order("title", { ascending: true });

  return (
    <div>
      <p className="eyebrow mb-2">Catalog</p>
      <h1 className="font-display text-3xl text-bone">Bulk Audio Upload</h1>
      <p className="mt-2 max-w-2xl text-sm text-bone/50">
        Drop in every audio file at once. Each filename is matched against
        your product catalog by keyword — strong matches upload
        automatically, anything ambiguous or unmatched is flagged below for
        you to assign by hand.
      </p>

      <div className="mt-8">
        <BulkAudioUploader products={products ?? []} />
      </div>
    </div>
  );
}
