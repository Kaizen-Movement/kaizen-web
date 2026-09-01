import { createClient } from "@/lib/supabase/server";
import { deleteProductFile } from "@/lib/actions/products";
import { BulkUploadUnassigned } from "@/components/admin/BulkUploadUnassigned";
import { AssignFileControl } from "@/components/admin/AssignFileControl";
import { DeleteFileButton } from "@/components/admin/DeleteFileButton";

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default async function MediaLibraryPage() {
  const supabase = createClient();

  const [{ data: files }, { data: products }] = await Promise.all([
    supabase
      .from("product_files")
      .select("*")
      .is("product_id", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id, title")
      .order("title"),
  ]);

  return (
    <div>
      <p className="eyebrow mb-2">Files</p>
      <h1 className="mb-8 font-display text-3xl text-bone">Media Library</h1>

      <div className="mb-8 max-w-2xl">
        <BulkUploadUnassigned />
      </div>

      <div className="border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-eyebrow text-bone/40">
              <th className="p-4">File</th>
              <th className="p-4">Size</th>
              <th className="p-4">Assign</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {(files ?? []).map((file) => (
              <tr key={file.id} className="border-b border-white/5">
                <td className="p-4 text-bone">
                  {file.file_name}
                  <span className="ml-2 text-xs text-bone/40">
                    {file.file_type}
                  </span>
                </td>
                <td className="p-4 text-bone/50">
                  {formatBytes(file.file_size_bytes)}
                </td>
                <td className="p-4">
                  <AssignFileControl
                    fileId={file.id}
                    products={products ?? []}
                  />
                </td>
                <td className="p-4 text-right">
                  <DeleteFileButton
                    fileId={file.id}
                    onDelete={deleteProductFile}
                  />
                </td>
              </tr>
            ))}
            {(!files || files.length === 0) && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-bone/40">
                  No unassigned files. Bulk-uploaded audio will show up here
                  until you assign it to a product.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
