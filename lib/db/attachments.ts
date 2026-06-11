import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type AttachmentRow = Database["public"]["Tables"]["attachments"]["Row"];

export async function createAttachment(
  supabase: Client,
  input: Database["public"]["Tables"]["attachments"]["Insert"],
) {
  const { data, error } = await supabase
    .from("attachments")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAttachmentByPathname(
  supabase: Client,
  blobPathname: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("blob_pathname", blobPathname)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function linkAttachmentsToMessage(
  supabase: Client,
  blobPathnames: string[],
  messageId: string,
  userId: string,
) {
  if (blobPathnames.length === 0) return;

  const { error } = await supabase
    .from("attachments")
    .update({ message_id: messageId })
    .eq("user_id", userId)
    .in("blob_pathname", blobPathnames);

  if (error) throw error;
}

export async function listAttachmentsForChat(
  supabase: Client,
  chatId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("chat_id", chatId)
    .eq("user_id", userId);

  if (error) throw error;
  return data ?? [];
}
