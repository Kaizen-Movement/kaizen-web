import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth";
import { getSignedUploadUrl } from "@/lib/r2/storage";

const MAX_COVER_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB ceiling for deliverables

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { productId, kind, fileName, contentType, fileSize } =
    await request.json();

  if (!kind || !fileName || !contentType) {
    return NextResponse.json(
      { error: "kind, fileName, and contentType are required." },
      { status: 400 }
    );
  }
  if (kind === "cover" && !productId) {
    return NextResponse.json(
      { error: "productId is required for cover uploads." },
      { status: 400 }
    );
  }

  if (kind === "cover" && fileSize > MAX_COVER_BYTES) {
    return NextResponse.json(
      { error: "Cover image must be under 8MB." },
      { status: 400 }
    );
  }
  if (kind === "deliverable" && fileSize > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File must be under 2GB." },
      { status: 400 }
    );
  }

  const safeName = sanitizeFilename(fileName);
  const key =
    kind === "cover"
      ? `covers/${productId}/${Date.now()}-${safeName}`
      : `deliverables/${productId ?? "unassigned"}/${Date.now()}-${safeName}`;

  const uploadUrl = await getSignedUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key });
}
