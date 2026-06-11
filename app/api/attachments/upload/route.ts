import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ATTACHMENTS_BLOB_PREFIX,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/attachments/constants";
import { upsertAttachment } from "@/lib/db/attachments";
import { getChat } from "@/lib/db/chats";
import { getBlobReadWriteToken } from "@/lib/env/blob";
import { createClient, getUser } from "@/lib/supabase/server";

const clientPayloadSchema = z.object({
  chatId: z.string().uuid(),
  filename: z.string().min(1).max(255),
  mediaType: z.string().min(1).max(255),
  sizeBytes: z.number().int().nonnegative(),
});

function validateAttachmentPathname(pathname: string, userId: string, chatId: string) {
  const prefix = `${ATTACHMENTS_BLOB_PREFIX}/${userId}/${chatId}/`;
  return pathname.startsWith(prefix) && pathname.length > prefix.length;
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: getBlobReadWriteToken(),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = clientPayloadSchema.parse(JSON.parse(clientPayload ?? "{}"));

        if (!validateAttachmentPathname(pathname, user.id, payload.chatId)) {
          throw new Error("Invalid attachment path.");
        }

        const supabase = await createClient();
        const chat = await getChat(supabase, payload.chatId, user.id);
        if (!chat) {
          throw new Error("Chat not found.");
        }

        return {
          maximumSizeInBytes: MAX_ATTACHMENT_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: clientPayload,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = clientPayloadSchema.parse(JSON.parse(tokenPayload ?? "{}"));

        if (!validateAttachmentPathname(blob.pathname, user.id, payload.chatId)) {
          throw new Error("Uploaded path does not match user scope.");
        }

        const supabase = await createClient();
        await upsertAttachment(supabase, {
          user_id: user.id,
          chat_id: payload.chatId,
          blob_pathname: blob.pathname,
          filename: payload.filename,
          media_type: payload.mediaType,
          size_bytes: payload.sizeBytes,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Attachment upload error:", error);
    const message =
      error instanceof Error ? error.message : "Attachment upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
