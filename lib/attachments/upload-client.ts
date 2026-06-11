import { upload } from "@vercel/blob/client";
import type { FileUIPart } from "ai";
import { nanoid } from "nanoid";

import {
  buildAttachmentBlobPath,
  buildAttachmentProxyUrl,
} from "@/lib/attachments/constants";

const MAX_IMAGE_WIDTH = 1600;
const JPEG_QUALITY = 0.85;

async function filePartToFile(part: FileUIPart): Promise<File> {
  const response = await fetch(part.url);
  const blob = await response.blob();
  return new File(
    [blob],
    part.filename ?? "attachment",
    { type: part.mediaType ?? blob.type },
  );
}

async function resizeImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap === "undefined") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    if (bitmap.width <= MAX_IMAGE_WIDTH) {
      bitmap.close();
      return file;
    }

    const scale = MAX_IMAGE_WIDTH / bitmap.width;
    const width = MAX_IMAGE_WIDTH;
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const resizedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });
    if (!resizedBlob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([resizedBlob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

async function registerAttachment(
  chatId: string,
  blobPathname: string,
  filename: string,
  mediaType: string,
  sizeBytes: number,
) {
  const response = await fetch("/api/attachments/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId,
      blobPathname,
      filename,
      mediaType,
      sizeBytes,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "Failed to register attachment.");
  }
}

export async function uploadAttachmentParts(
  parts: FileUIPart[],
  chatId: string,
  userId: string,
): Promise<FileUIPart[]> {
  const uploaded: FileUIPart[] = [];

  for (const part of parts) {
    const rawFile = await filePartToFile(part);
    const file = await resizeImageIfNeeded(rawFile);
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

    await registerAttachment(
      chatId,
      blob.pathname,
      file.name,
      file.type || "application/octet-stream",
      file.size,
    );

    uploaded.push({
      type: "file",
      filename: file.name,
      mediaType: file.type || "application/octet-stream",
      url: buildAttachmentProxyUrl(blob.pathname),
    });
  }

  return uploaded;
}
