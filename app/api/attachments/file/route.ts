import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";

import {
  buildAttachmentBlobPath,
  buildAttachmentProxyUrl,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/attachments/constants";
import { upsertAttachment } from "@/lib/db/attachments";
import { getChat } from "@/lib/db/chats";
import { getBlobAccess, getBlobReadWriteToken } from "@/lib/env/blob";
import { createClient, getUser } from "@/lib/supabase/server";

const chatIdSchema = z.string().uuid();

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const chatId = chatIdSchema.parse(formData.get("chatId"));
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty." }, { status: 400 });
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json(
        { error: `File exceeds ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB limit.` },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const chat = await getChat(supabase, chatId, user.id);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }

    const fileId = nanoid();
    const pathname = buildAttachmentBlobPath(
      user.id,
      chatId,
      fileId,
      file.name || "attachment",
    );

    const mediaType = file.type || "application/octet-stream";

    const blob = await put(pathname, file, {
      access: getBlobAccess(),
      token: getBlobReadWriteToken(),
      contentType: mediaType,
      addRandomSuffix: false,
    });

    await upsertAttachment(supabase, {
      user_id: user.id,
      chat_id: chatId,
      blob_pathname: blob.pathname,
      filename: file.name || "attachment",
      media_type: mediaType,
      size_bytes: file.size,
    });

    return NextResponse.json({
      pathname: blob.pathname,
      url: buildAttachmentProxyUrl(blob.pathname),
      filename: file.name || "attachment",
      mediaType,
    });
  } catch (error) {
    console.error("Attachment file upload error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "Attachment upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
