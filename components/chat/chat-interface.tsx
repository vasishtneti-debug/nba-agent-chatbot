"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo } from "react";

import { ChatHeader } from "@/components/chat/chat-header";
import { MessageInput } from "@/components/chat/message-input";
import { MessageList } from "@/components/chat/message-list";

type ChatInterfaceProps = {
  chatId: string;
  chatTitle: string;
  initialMessages: UIMessage[];
};

export function ChatInterface({
  chatId,
  chatTitle,
  initialMessages,
}: ChatInterfaceProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { chatId },
      }),
    [chatId],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
  });

  const isBusy = status === "submitted" || status === "streaming";

  function handleSend(text: string) {
    void sendMessage({ text });
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ChatHeader title={chatTitle} />
      <MessageList messages={messages} status={status} onSelectPrompt={handleSend} />
      {error && (
        <div className="border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error.message || "Something went wrong. Try again."}
        </div>
      )}
      <MessageInput onSend={handleSend} disabled={isBusy} />
    </div>
  );
}
