import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteChat, getChat, updateChatTitle } from "@/lib/db/chats";
import { getMessages } from "@/lib/db/messages";
import { createClient, getUser } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ chatId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId } = await context.params;
  const supabase = await createClient();
  const chat = await getChat(supabase, chatId, user.id);

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const messages = await getMessages(supabase, chatId);
  return NextResponse.json({ chat, messages });
}

const patchSchema = z.object({
  title: z.string().min(1).max(120),
});

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId } = await context.params;
  const body = patchSchema.parse(await request.json());
  const supabase = await createClient();

  const existing = await getChat(supabase, chatId, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const chat = await updateChatTitle(supabase, chatId, user.id, body.title);
  return NextResponse.json({ chat });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId } = await context.params;
  const supabase = await createClient();

  const existing = await getChat(supabase, chatId, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  await deleteChat(supabase, chatId, user.id);
  return NextResponse.json({ success: true });
}
