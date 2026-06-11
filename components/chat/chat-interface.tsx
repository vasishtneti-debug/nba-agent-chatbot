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
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputHeader,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  AttachmentChips,
  AttachmentDropHint,
  AttachmentPromptSubmit,
} from "@/components/chat/attachment-chips";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { SUGGESTED_PROMPTS } from "@/components/chat/suggested-prompts";
import { Spinner } from "@/components/ui/spinner";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from "@/lib/attachments/constants";
import { uploadAttachmentParts } from "@/lib/attachments/upload-client";
import { createMessageId } from "@/lib/ids";

type ChatInterfaceProps = {
  chatId: string;
  chatTitle: string;
  userId: string;
  initialMessages: UIMessage[];
};

export function ChatInterface({
  chatId,
  chatTitle,
  userId,
  initialMessages,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const isBusy =
    status === "submitted" || status === "streaming" || isUploading;
  const showPendingAssistant =
    status === "submitted" && messages.at(-1)?.role === "user";

  async function handleSubmit(message: PromptInputMessage) {
    const text = message.text.trim();
    const hasFiles = message.files.length > 0;
    if ((!text && !hasFiles) || isBusy) return;

    setUploadError(null);

    try {
      setIsUploading(true);
      const uploadedFiles = hasFiles
        ? await uploadAttachmentParts(message.files, chatId, userId)
        : [];

      void sendMessage({
        text: text || "Review the attached file(s).",
        files: uploadedFiles,
      });
      setInput("");
    } catch (uploadErr) {
      console.error("Attachment upload failed:", uploadErr);
      setUploadError(
        uploadErr instanceof Error
          ? uploadErr.message
          : "Failed to upload attachments.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleSuggestionClick(suggestion: string) {
    if (isBusy) return;
    void sendMessage({ text: suggestion });
  }

  const displayError = uploadError || error?.message;

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

      {displayError && (
        <div className="border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {displayError || "Something went wrong. Try again."}
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

          <PromptInput
            onSubmit={handleSubmit}
            multiple
            maxFiles={MAX_ATTACHMENTS_PER_MESSAGE}
            maxFileSize={MAX_ATTACHMENT_BYTES}
            onError={(err) => setUploadError(err.message)}
          >
            <PromptInputHeader>
              <AttachmentChips />
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="Ask Drew about trades, injuries, contracts…"
                disabled={isBusy}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger
                    tooltip="Add attachment"
                    disabled={isBusy}
                  />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments label="Add files" />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <AttachmentDropHint />
              </PromptInputTools>
              <AttachmentPromptSubmit
                input={input}
                status={status}
                isUploading={isUploading}
                onStop={stop}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
