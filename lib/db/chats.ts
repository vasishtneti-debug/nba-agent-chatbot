import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export async function createChat(supabase: Client, userId: string, title = "New Chat") {
  const { data, error } = await supabase
    .from("chats")
    .insert({ user_id: userId, title })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listChats(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getChat(supabase: Client, chatId: string, userId: string) {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}

export async function updateChatTitle(
  supabase: Client,
  chatId: string,
  userId: string,
  title: string,
) {
  const { data, error } = await supabase
    .from("chats")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", chatId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChat(supabase: Client, chatId: string, userId: string) {
  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", chatId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function touchChat(supabase: Client, chatId: string) {
  await supabase
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatId);
}
