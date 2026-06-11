export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_MESSAGE = 3;

export const ATTACHMENTS_BLOB_PREFIX = "attachments";

export function buildAttachmentBlobPath(
  userId: string,
  chatId: string,
  fileId: string,
  filename: string,
) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${ATTACHMENTS_BLOB_PREFIX}/${userId}/${chatId}/${fileId}-${safeName}`;
}

export function buildAttachmentProxyUrl(blobPathname: string) {
  return `/api/attachments/${blobPathname.replace(/^attachments\//, "")}`;
}

export function parseAttachmentProxyPath(segments: string[]) {
  if (segments.length < 3) return null;
  const [userId, chatId, ...rest] = segments;
  if (!userId || !chatId || rest.length === 0) return null;
  const filename = rest.join("/");
  const blobPathname = `${ATTACHMENTS_BLOB_PREFIX}/${userId}/${chatId}/${filename}`;
  return { userId, chatId, blobPathname };
}
