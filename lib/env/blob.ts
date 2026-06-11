import type { BlobAccessType } from "@vercel/blob";

export function getBlobReadWriteToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set. Link a Vercel Blob store or add the token to .env.local.",
    );
  }
  return token;
}

/**
 * Vercel Blob stores are either public-only or private-capable.
 * Set BLOB_ACCESS=private only if your store supports private blobs.
 * Default public matches the default Vercel Blob store configuration.
 */
export function getBlobAccess(): BlobAccessType {
  const access = process.env.BLOB_ACCESS?.toLowerCase();
  if (access === "private") return "private";
  return "public";
}
