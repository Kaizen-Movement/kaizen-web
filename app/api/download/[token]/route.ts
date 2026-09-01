import { NextResponse } from "next/server";
import { redeemDownloadToken } from "@/lib/downloads";

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const ip = request.headers.get("x-forwarded-for");
  const userAgent = request.headers.get("user-agent");

  const result = await redeemDownloadToken(params.token, ip, userAgent);

  if (!result.ok) {
    const status =
      result.reason === "not_found"
        ? 404
        : result.reason === "expired"
          ? 410
          : 429; // limit_reached
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({
    url: result.url,
    fileName: result.fileName,
    productTitle: result.productTitle,
  });
}
