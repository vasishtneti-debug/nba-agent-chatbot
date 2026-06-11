import { ATTACHMENTS_BLOB_PREFIX } from "@/lib/attachments/constants";

export function proxyUrlToBlobPathname(url: string): string | null {
  const prefix = "/api/attachments/";
  if (!url.startsWith(prefix)) return null;
  return `${ATTACHMENTS_BLOB_PREFIX}/${url.slice(prefix.length)}`;
}

export function blobPathnameFromFilePart(url: string): string | null {
  if (url.startsWith("/api/attachments/")) {
    return proxyUrlToBlobPathname(url);
  }
  if (url.startsWith(`${ATTACHMENTS_BLOB_PREFIX}/`)) {
    return url;
  }
  return null;
}
