"use client";

import type { UIMessage } from "ai";
import { PaperclipIcon } from "lucide-react";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@/components/ai-elements/tool";

type ChatMessagesProps = {
  messages: UIMessage[];
};

const TOOL_LABELS: Record<string, string> = {
  "tool-nbaNewsSearch": "Scanning the wire…",
  "tool-nbaContractsSearch": "Checking contracts & cap…",
  "tool-nbaGeneralSearch": "Searching league sources…",
  "tool-nbaExtract": "Reading source…",
  "tool-nbaWebSearch": "Scanning the wire…",
};

function isToolPart(part: UIMessage["parts"][number]): part is ToolPart {
  return part.type.startsWith("tool-");
}

function renderFilePart(
  part: UIMessage["parts"][number] & { type: "file" },
  messageId: string,
  index: number,
) {
  const isImage = part.mediaType?.startsWith("image/");

  if (isImage && part.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- attachment proxy or data URL
      <img
        key={`${messageId}-file-${index}`}
        src={part.url}
        alt={part.filename ?? "Attachment"}
        className="max-h-64 max-w-full rounded-md object-contain"
      />
    );
  }

  return (
    <div
      key={`${messageId}-file-${index}`}
      className="flex items-center gap-2 rounded-md border border-border/50 bg-background/20 px-3 py-2 text-xs"
    >
      <PaperclipIcon className="size-4 shrink-0" />
      <span className="truncate">{part.filename ?? "Attachment"}</span>
    </div>
  );
}

function renderPart(
  part: UIMessage["parts"][number],
  messageId: string,
  index: number,
) {
  if (part.type === "text") {
    return (
      <MessageResponse key={`${messageId}-text-${index}`}>
        {part.text}
      </MessageResponse>
    );
  }

  if (part.type === "file") {
    return renderFilePart(part, messageId, index);
  }

  if (isToolPart(part)) {
    const isRunning =
      part.state === "input-streaming" ||
      part.state === "input-available" ||
      part.state === "approval-requested";

    const toolTitle = TOOL_LABELS[part.type];

    const toolHeader =
      part.type === "dynamic-tool" ? (
        <ToolHeader
          type={part.type}
          state={part.state}
          toolName={part.toolName}
          title={toolTitle}
        />
      ) : (
        <ToolHeader type={part.type} state={part.state} title={toolTitle} />
      );

    return (
      <Tool
        key={`${messageId}-tool-${index}`}
        defaultOpen={!isRunning && part.state === "output-available"}
      >
        {toolHeader}
        <ToolContent>
          <ToolInput input={part.input} />
          <ToolOutput output={part.output} errorText={part.errorText} />
        </ToolContent>
      </Tool>
    );
  }

  return null;
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <>
      {messages.map((message) => (
        <Message from={message.role} key={message.id}>
          <MessageContent>
            {message.parts.map((part, index) =>
              renderPart(part, message.id, index),
            )}
          </MessageContent>
        </Message>
      ))}
    </>
  );
}
