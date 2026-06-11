import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

import {
  buildAttachmentBlobPath,
  buildAttachmentProxyUrl,
} from "@/lib/attachments/constants";
import { upsertAttachment } from "@/lib/db/attachments";
import { getBlobAccess, getBlobReadWriteToken } from "@/lib/env/blob";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function saveFilledContract(
  supabase: SupabaseClient,
  input: {
    userId: string;
    chatId: string;
    messageId?: string;
    buffer: Buffer;
    filename: string;
    mediaType: string;
  },
) {
  const fileId = nanoid();
  const pathname = buildAttachmentBlobPath(
    input.userId,
    input.chatId,
    fileId,
    input.filename,
  );

  const blob = await put(pathname, input.buffer, {
    access: getBlobAccess(),
    token: getBlobReadWriteToken(),
    contentType: input.mediaType,
    addRandomSuffix: false,
  });

  await upsertAttachment(supabase, {
    user_id: input.userId,
    chat_id: input.chatId,
    message_id: input.messageId ?? null,
    blob_pathname: blob.pathname,
    filename: input.filename,
    media_type: input.mediaType,
    size_bytes: input.buffer.length,
  });

  return {
    pathname: blob.pathname,
    url: buildAttachmentProxyUrl(blob.pathname),
    filename: input.filename,
    mediaType: input.mediaType,
    sizeBytes: input.buffer.length,
  };
}
