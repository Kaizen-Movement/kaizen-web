import "server-only";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, R2_BUCKET } from "./client";

/**
 * Cover images: short-lived signed GET URL for display on the storefront.
 * Regenerated on every page render, so there's no need for a long expiry.
 */
export async function getSignedCoverUrl(
  key: string | null
): Promise<string | null> {
  if (!key) return null;
  const client = getR2Client();
  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn: 60 * 60 }); // 1 hour
}

/** Batch version — avoids resolving cover URLs one at a time in a loop. */
export async function getSignedCoverUrls(
  keys: (string | null)[]
): Promise<(string | null)[]> {
  return Promise.all(keys.map((k) => getSignedCoverUrl(k)));
}

/**
 * Product deliverables (the actual audio/software file): much shorter TTL,
 * generated only at the moment of an authorized, rate-limited download
 * redemption — see /api/download/[token].
 */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn: 5 * 60 }); // 5 minutes
}

/**
 * Direct browser-to-R2 upload — the file bytes never pass through our own
 * server/Vercel function, which avoids serverless request-body size limits
 * entirely. Admin gets this URL, PUTs the file straight to R2 with it, then
 * calls /api/admin/upload/complete to record the resulting key.
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 5 * 60 }); // 5 minutes
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}
