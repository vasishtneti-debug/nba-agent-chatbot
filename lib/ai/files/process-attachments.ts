import { get } from "@vercel/blob";
import type { UIMessage } from "ai";

import { blobPathnameFromFilePart } from "@/lib/attachments/pathname";
import { getAttachmentByPathname } from "@/lib/db/attachments";
import { getBlobReadWriteToken } from "@/lib/env/blob";
import type { createClient } from "@/lib/supabase/server";

import {
  extractTextFromBuffer,
  isImageMediaType,
} from "./extractors";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function readBlobBytes(blobPathname: string) {
  const result = await get(blobPathname, {
    access: "private",
    token: getBlobReadWriteToken(),
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error("Attachment file could not be read.");
  }

  const arrayBuffer = await new Response(result.stream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function processMessageFiles(
  supabase: SupabaseClient,
  messages: UIMessage[],
  userId: string,
): Promise<UIMessage[]> {
  return Promise.all(
    messages.map(async (message) => {
      if (message.role !== "user") return message;

      const parts = await Promise.all(
        message.parts.map(async (part) => {
          if (part.type !== "file") return part;

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
              const base64 = buffer.toString("base64");
              return {
                type: "file" as const,
                filename,
                mediaType,
                url: `data:${mediaType};base64,${base64}`,
              };
            }

            const extracted = await extractTextFromBuffer(
              buffer,
              mediaType,
              filename,
            );

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
