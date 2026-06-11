import { upload } from "@vercel/blob/client";
import type { FileUIPart } from "ai";
import { nanoid } from "nanoid";

import {
  buildAttachmentBlobPath,
  buildAttachmentProxyUrl,
} from "@/lib/attachments/constants";

async function filePartToFile(part: FileUIPart): Promise<File> {
  const response = await fetch(part.url);
  const blob = await response.blob();
  return new File(
    [blob],
    part.filename ?? "attachment",
    { type: part.mediaType ?? blob.type },
  );
}

export async function uploadAttachmentParts(
  parts: FileUIPart[],
  chatId: string,
  userId: string,
): Promise<FileUIPart[]> {
  const uploaded: FileUIPart[] = [];

  for (const part of parts) {
    const file = await filePartToFile(part);
    const fileId = nanoid();
    const pathname = buildAttachmentBlobPath(
      userId,
      chatId,
      fileId,
      file.name,
    );

    const clientPayload = JSON.stringify({
      chatId,
      filename: file.name,
      mediaType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    });

    const blob = await upload(pathname, file, {
      access: "private",
      handleUploadUrl: "/api/attachments/upload",
      clientPayload,
    });

    uploaded.push({
      type: "file",
      filename: file.name,
      mediaType: file.type || "application/octet-stream",
      url: buildAttachmentProxyUrl(blob.pathname),
    });
  }

  return uploaded;
}
