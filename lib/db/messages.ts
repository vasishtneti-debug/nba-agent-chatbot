import type { UIMessage } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export function dbMessageToUIMessage(row: {
  id: string;
  role: "user" | "assistant";
  parts: Json;
}): UIMessage {
  const parts = row.parts as UIMessage["parts"];
  return {
    id: row.id,
    role: row.role,
    parts: Array.isArray(parts) ? parts : [],
  };
}

export async function getMessages(supabase: Client, chatId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(dbMessageToUIMessage);
}

export async function saveMessage(
  supabase: Client,
  chatId: string,
  message: UIMessage,
) {
  const role = message.role === "user" ? "user" : "assistant";
  if (role !== "user" && role !== "assistant") {
    throw new Error(`Unsupported message role: ${message.role}`);
  }

  // Let Postgres generate a UUID — AI SDK message ids (e.g. "QZK0fTFBhQoakbZL") are not UUIDs.
  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      role,
      parts: message.parts as Json,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertMessage(
  supabase: Client,
  chatId: string,
  message: UIMessage,
) {
  const role = message.role === "user" ? "user" : "assistant";

  const { data, error } = await supabase
    .from("messages")
    .upsert({
      chat_id: chatId,
      role,
      parts: message.parts as Json,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
