import type { UIMessage } from "ai";

import { readBlobBytes } from "@/lib/attachments/read-blob";
import { blobPathnameFromFilePart } from "@/lib/attachments/pathname";
import { getAttachmentByPathname } from "@/lib/db/attachments";
import type { createClient } from "@/lib/supabase/server";

import {
  extractTextFromBuffer,
  isImageMediaType,
} from "./extractors";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const MAX_IMAGE_BYTES_FOR_MODEL = 2 * 1024 * 1024;

async function processFilePart(
  supabase: SupabaseClient,
  part: UIMessage["parts"][number] & { type: "file" },
  userId: string,
) {
  const filename = part.filename ?? "attachment";
  const mediaType = part.mediaType ?? "application/octet-stream";
  const blobPathname = blobPathnameFromFilePart(part.url);

  if (!blobPathname) {
    return {
      type: "text" as const,
      text: `[Attachment "${filename}" could not be loaded — missing storage reference.]`,
    };
  }

  const attachment = await getAttachmentByPathname(
    supabase,
    blobPathname,
    userId,
  );
  if (!attachment) {
    return {
      type: "text" as const,
      text: `[Attachment "${filename}" was not found or access was denied.]`,
    };
  }

  try {
    const buffer = await readBlobBytes(blobPathname);

    if (isImageMediaType(mediaType)) {
      if (buffer.length > MAX_IMAGE_BYTES_FOR_MODEL) {
        return {
          type: "text" as const,
          text: `[User attached image "${filename}" (${Math.round(buffer.length / 1024)} KB). Image was too large to analyze inline — ask them to describe it or attach a smaller screenshot.]`,
        };
      }

      const base64 = buffer.toString("base64");
      return {
        type: "file" as const,
        filename,
        mediaType,
        url: `data:${mediaType};base64,${base64}`,
      };
    }

    const extracted = await extractTextFromBuffer(buffer, mediaType, filename);

    return {
      type: "text" as const,
      text: `**Attached file: ${filename}**\n\n${extracted}`,
    };
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Could not read file.";
    return {
      type: "text" as const,
      text: `[Attachment "${filename}" could not be processed: ${reason}]`,
    };
  }
}

function filePartToPlaceholder(
  part: UIMessage["parts"][number] & { type: "file" },
) {
  const filename = part.filename ?? "attachment";
  return {
    type: "text" as const,
    text: `[Earlier attachment: ${filename}]`,
  };
}

export async function processMessageFiles(
  supabase: SupabaseClient,
  messages: UIMessage[],
  userId: string,
): Promise<UIMessage[]> {
  const lastUserMessageIndex = messages.findLastIndex((m) => m.role === "user");

  return Promise.all(
    messages.map(async (message, index) => {
      if (message.role !== "user") return message;

      const shouldProcessFiles = index === lastUserMessageIndex;

      const parts = await Promise.all(
        message.parts.map(async (part) => {
          if (part.type !== "file") return part;
          if (!shouldProcessFiles) return filePartToPlaceholder(part);
          return processFilePart(supabase, part, userId);
        }),
      );

      return { ...message, parts };
    }),
  );
}

export function collectBlobPathnamesFromMessage(message: UIMessage): string[] {
  return message.parts
    .filter((part) => part.type === "file")
    .map((part) => blobPathnameFromFilePart(part.url))
    .filter((pathname): pathname is string => pathname !== null);
}
