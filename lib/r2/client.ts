import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

let cachedClient: S3Client | null = null;

export function getR2Client() {
  if (cachedClient) return cachedClient;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials are not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)."
    );
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // R2 only supports path-style requests (bucket in the URL path, e.g.
    // https://<account>.r2.cloudflarestorage.com/<bucket>/<key>) — it does
    // NOT support virtual-hosted-style (bucket as a subdomain), unlike AWS
    // S3. The AWS SDK defaults to virtual-hosted-style unless told
    // otherwise, which produces URLs like
    // https://kaizen-site.<account>.r2.cloudflarestorage.com/<key> — an
    // extra subdomain level that fails TLS validation against R2's
    // wildcard certificate. This surfaces in the browser as a generic,
    // status-less "Failed to fetch" on the direct PUT to R2, with no
    // useful error from R2 itself since the request never completes a
    // TLS handshake.
    forcePathStyle: true,
    // Newer AWS SDK v3 releases (package.json allows any 3.x, currently
    // resolving to 3.1077.0) default to attaching an automatic CRC32
    // request checksum to S3 operations, including presigned URLs — the
    // checksum is computed as a placeholder at presign time (since the
    // real file body isn't known yet), baked into the signed query
    // string as x-amz-checksum-crc32/x-amz-sdk-checksum-algorithm, and
    // R2 then rejects the actual upload with 400 because the real
    // content doesn't match that placeholder. AWS S3 itself tolerates
    // this; R2 (and other S3-compatible services) don't. Setting this to
    // WHEN_REQUIRED restores the old opt-in-only behavior.
    requestChecksumCalculation: "WHEN_REQUIRED",
  });

  return cachedClient;
}

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "kaizen-site";
