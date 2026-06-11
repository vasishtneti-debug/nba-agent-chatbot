import { NextResponse } from "next/server";
import { z } from "zod";

import { createChat, listChats } from "@/lib/db/chats";
import { createClient, getUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const chats = await listChats(supabase, user.id);
  return NextResponse.json({ chats });
}

const createChatSchema = z.object({
  title: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof createChatSchema> = {};
  try {
    const json = await request.json();
    body = createChatSchema.parse(json);
  } catch {
    body = {};
  }

  const supabase = await createClient();
  const chat = await createChat(supabase, user.id, body.title);

  return NextResponse.json({ chat }, { status: 201 });
}
