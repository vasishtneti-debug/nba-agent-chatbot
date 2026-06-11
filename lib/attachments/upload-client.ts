import type { FileUIPart } from "ai";

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

async function uploadFileToServer(file: File, chatId: string): Promise<FileUIPart> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("chatId", chatId);

  const response = await fetch("/api/attachments/file", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    url?: string;
    filename?: string;
    mediaType?: string;
  } | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to upload attachment.");
  }

  if (!payload?.url) {
    throw new Error("Upload succeeded but no file URL was returned.");
  }

  return {
    type: "file",
    filename: payload.filename ?? file.name,
    mediaType: payload.mediaType ?? file.type,
    url: payload.url,
  };
}

export async function uploadAttachmentParts(
  parts: FileUIPart[],
  chatId: string,
  _userId: string,
): Promise<FileUIPart[]> {
  const uploaded: FileUIPart[] = [];

  for (const part of parts) {
    const rawFile = await filePartToFile(part);
    const file = await resizeImageIfNeeded(rawFile);
    uploaded.push(await uploadFileToServer(file, chatId));
  }

  return uploaded;
}
