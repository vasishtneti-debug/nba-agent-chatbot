"use client";

import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";

import { EmptyState } from "@/components/chat/empty-state";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

type MessageListProps = {
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
  onSelectPrompt: (prompt: string) => void;
};

export function MessageList({ messages, status, onSelectPrompt }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  if (messages.length === 0) {
    return <EmptyState onSelectPrompt={onSelectPrompt} disabled={isBusy} />;
  }

  return (
    <ScrollArea className="min-h-0 flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {status === "submitted" && (
          <div className="flex gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
