import { NextResponse } from "next/server";
import { z } from "zod";

import { ATTACHMENTS_BLOB_PREFIX } from "@/lib/attachments/constants";
import { upsertAttachment } from "@/lib/db/attachments";
import { getChat } from "@/lib/db/chats";
import { createClient, getUser } from "@/lib/supabase/server";

const registerSchema = z.object({
  chatId: z.string().uuid(),
  blobPathname: z.string().min(1),
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

  try {
    const body = registerSchema.parse(await request.json());

    if (!validateAttachmentPathname(body.blobPathname, user.id, body.chatId)) {
      return NextResponse.json({ error: "Invalid attachment path." }, { status: 400 });
    }

    const supabase = await createClient();
    const chat = await getChat(supabase, body.chatId, user.id);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }

    const attachment = await upsertAttachment(supabase, {
      user_id: user.id,
      chat_id: body.chatId,
      blob_pathname: body.blobPathname,
      filename: body.filename,
      media_type: body.mediaType,
      size_bytes: body.sizeBytes,
    });

    return NextResponse.json({ attachment });
  } catch (error) {
    console.error("Attachment register error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to register attachment." }, { status: 500 });
  }
}
