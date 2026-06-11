import { tool } from "ai";
import { z } from "zod";

import { readBlobBytes } from "@/lib/attachments/read-blob";
import { fillContractDocument } from "@/lib/contracts/fill-document";
import { saveFilledContract } from "@/lib/contracts/save-filled";
import { getAttachmentByPathname } from "@/lib/db/attachments";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type FillContractToolContext = {
  supabase: SupabaseClient;
  userId: string;
  chatId: string;
  messageId: string;
  attachmentPathnames: string[];
};

export function getFillContractTool(context: FillContractToolContext) {
  const attachmentHint =
    context.attachmentPathnames.length > 0
      ? `Available attachments in this message: ${context.attachmentPathnames.join(", ")}`
      : "No attachments in the current message — ask the user to upload the blank contract first.";

  return tool({
    description: `Fill a blank NBA contract template with player and deal details.

Use when the user uploads a blank contract (PDF, DOCX, or text) and wants it completed.
${attachmentHint}

Workflow:
1. Read the attached contract text to identify blank fields (brackets, underscores, form fields).
2. Gather missing info from the user or nbaContractsSearch before calling this tool.
3. Pass exact placeholder strings as keys in fieldValues (e.g. "[Player Name]", "{{salary}}").
4. If only one attachment exists, omit sourceBlobPathname — it will be used automatically.

Returns a download URL for the filled document.`,
    inputSchema: z.object({
      sourceBlobPathname: z
        .string()
        .optional()
        .describe(
          "Blob pathname of the blank contract attachment. Defaults to the only attachment in the current message.",
        ),
      fieldValues: z
        .record(z.string(), z.string())
        .describe(
          "Map of placeholder strings or PDF form field names to filled values.",
        ),
      outputFilename: z
        .string()
        .optional()
        .describe("Optional custom filename for the filled document."),
    }),
    execute: async ({ sourceBlobPathname, fieldValues, outputFilename }) => {
      const pathname =
        sourceBlobPathname ??
        (context.attachmentPathnames.length === 1
          ? context.attachmentPathnames[0]
          : null);

      if (!pathname) {
        return {
          success: false as const,
          error:
            context.attachmentPathnames.length === 0
              ? "No contract attachment found. Ask the user to upload the blank contract."
              : "Multiple attachments found. Specify sourceBlobPathname for the blank contract.",
        };
      }

      const attachment = await getAttachmentByPathname(
        context.supabase,
        pathname,
        context.userId,
      );

      if (!attachment) {
        return {
          success: false as const,
          error: "Contract attachment not found or access denied.",
        };
      }

      const buffer = await readBlobBytes(pathname);
      const result = await fillContractDocument(
        buffer,
        attachment.media_type,
        attachment.filename,
        fieldValues,
      );

      const saved = await saveFilledContract(context.supabase, {
        userId: context.userId,
        chatId: context.chatId,
        messageId: context.messageId,
        buffer: result.buffer,
        filename: outputFilename ?? result.filename,
        mediaType: result.mediaType,
      });

      return {
        success: true as const,
        downloadUrl: saved.url,
        filename: saved.filename,
        mediaType: saved.mediaType,
        sizeBytes: saved.sizeBytes,
        method: result.method,
        detectedPlaceholders: result.detectedPlaceholders,
        filledFields: result.filledFields,
        notes: result.notes,
      };
    },
  });
}
