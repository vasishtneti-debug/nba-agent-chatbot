export function getBlobReadWriteToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set. Link a Vercel Blob store or add the token to .env.local.",
    );
  }
  return token;
}
