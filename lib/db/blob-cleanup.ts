import { del } from "@vercel/blob";
import type { SupabaseClient } from "@supabase/supabase-js";

import { listAttachmentsForChat } from "@/lib/db/attachments";
import { getBlobReadWriteToken } from "@/lib/env/blob";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export async function deleteChatBlobFiles(
  supabase: Client,
  chatId: string,
  userId: string,
) {
  const attachments = await listAttachmentsForChat(supabase, chatId, userId);
  if (attachments.length === 0) return;

  await del(
    attachments.map((attachment) => attachment.blob_pathname),
    { token: getBlobReadWriteToken() },
  );
}
