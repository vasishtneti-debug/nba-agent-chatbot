"use client";

import type { UIMessage } from "ai";

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

function isToolPart(part: UIMessage["parts"][number]): part is ToolPart {
  return part.type.startsWith("tool-");
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

  if (isToolPart(part)) {
    const isSearchTool = part.type === "tool-nbaWebSearch";
    const isRunning =
      part.state === "input-streaming" ||
      part.state === "input-available" ||
      part.state === "approval-requested";

    const toolHeader =
      part.type === "dynamic-tool" ? (
        <ToolHeader
          type={part.type}
          state={part.state}
          toolName={part.toolName}
          title={isSearchTool ? "Scanning the wire…" : undefined}
        />
      ) : (
        <ToolHeader
          type={part.type}
          state={part.state}
          title={isSearchTool ? "Scanning the wire…" : undefined}
        />
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
