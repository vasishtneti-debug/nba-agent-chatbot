"use client";

import type { UIMessage } from "ai";

import {
  isToolSearchLoading,
  isToolSearchPart,
  SearchIndicator,
} from "@/components/chat/search-indicator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  message: UIMessage;
};

function getTextParts(message: UIMessage) {
  return message.parts.filter((part) => part.type === "text");
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const textParts = getTextParts(message);
  const toolParts = message.parts.filter(isToolSearchPart);
  const showSearchLoading = toolParts.some(isToolSearchLoading);

  return (
    <div
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {!isUser && (
        <Avatar className="mt-1 size-8 shrink-0 ring-1 ring-primary/40">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            DR
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2 sm:max-w-[75%]",
          isUser ? "items-end" : "items-start",
        )}
      >
        {showSearchLoading && <SearchIndicator />}
        {textParts.map((part, index) => (
          <div
            key={`${message.id}-text-${index}`}
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
              isUser
                ? "bg-primary text-primary-foreground"
                : "border border-border/60 bg-card text-foreground",
            )}
          >
            {part.text}
          </div>
        ))}
      </div>
    </div>
  );
}
