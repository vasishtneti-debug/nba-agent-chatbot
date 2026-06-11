"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Image from "next/image";
import { useMemo, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { SUGGESTED_PROMPTS } from "@/components/chat/suggested-prompts";
import { Spinner } from "@/components/ui/spinner";
import { createMessageId } from "@/lib/ids";

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
  const [input, setInput] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ body, messages }) => ({
          body: {
            ...body,
            chatId,
            messages,
          },
        }),
      }),
    [chatId],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    generateId: createMessageId,
  });

  const isBusy = status === "submitted" || status === "streaming";
  const showPendingAssistant =
    status === "submitted" &&
    messages.at(-1)?.role === "user";

  function handleSubmit(message: PromptInputMessage) {
    const text = message.text.trim();
    if (!text || isBusy) return;
    void sendMessage({ text });
    setInput("");
  }

  function handleSuggestionClick(suggestion: string) {
    if (isBusy) return;
    void sendMessage({ text: suggestion });
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ChatHeader title={chatTitle} />

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto max-w-3xl gap-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="I'm Drew — your NBA agent on the inside."
              description="Trades, injuries, standings, contract leverage — ask me anything happening in the league right now."
              icon={
                <div className="relative size-16 overflow-hidden rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background">
                  <Image
                    src="/drew-logo.svg"
                    alt="Drew"
                    width={64}
                    height={64}
                    className="size-full"
                  />
                </div>
              }
            />
          ) : (
            <ChatMessages messages={messages} />
          )}

          {showPendingAssistant && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4 text-primary" />
              <span>Drew is on the line…</span>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {error && (
        <div className="border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error.message || "Something went wrong. Try again."}
        </div>
      )}

      <div className="border-t border-border/60 bg-background/80 p-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {messages.length === 0 && (
            <Suggestions>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <Suggestion
                  key={prompt}
                  suggestion={prompt}
                  onClick={handleSuggestionClick}
                  disabled={isBusy}
                  className="max-w-xs whitespace-normal text-left"
                />
              ))}
            </Suggestions>
          )}

          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="Ask Drew about trades, injuries, standings…"
                disabled={isBusy}
              />
            </PromptInputBody>
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit
                status={status}
                onStop={stop}
                disabled={!input.trim() && !isBusy}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
