import { redirect } from "next/navigation";

import { createChat } from "@/lib/db/chats";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function NewChatPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const chat = await createChat(supabase, user.id);
  redirect(`/chat/${chat.id}`);
}
