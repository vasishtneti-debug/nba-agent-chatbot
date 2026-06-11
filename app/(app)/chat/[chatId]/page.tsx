import { notFound, redirect } from "next/navigation";

import { ChatInterface } from "@/components/chat/chat-interface";
import { getChat } from "@/lib/db/chats";
import { getMessages } from "@/lib/db/messages";
import { createClient, getUser } from "@/lib/supabase/server";

type ChatPageProps = {
  params: Promise<{ chatId: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const { chatId } = await params;
  const supabase = await createClient();
  const chat = await getChat(supabase, chatId, user.id);

  if (!chat) {
    notFound();
  }

  const messages = await getMessages(supabase, chatId);

  return (
    <ChatInterface
      chatId={chat.id}
      chatTitle={chat.title}
      userId={user.id}
      initialMessages={messages}
    />
  );
}
