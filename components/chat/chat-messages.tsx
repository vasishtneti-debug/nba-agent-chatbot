"use client";

import type { UIMessage } from "ai";
import { DownloadIcon, PaperclipIcon } from "lucide-react";
import { useMemo, useState } from "react";

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
import { Spinner } from "@/components/ui/spinner";
import {
  appendFilledContractsToMessage,
  isFillContractOutput,
  type FillContractOutput,
} from "@/lib/ai/messages/append-filled-contracts";
import { downloadAttachment } from "@/lib/attachments/download-client";

type ChatMessagesProps = {
  messages: UIMessage[];
};

const TOOL_LABELS: Record<string, string> = {
  "tool-nbaNewsSearch": "Scanning the wire…",
  "tool-nbaContractsSearch": "Checking contracts & cap…",
  "tool-nbaGeneralSearch": "Searching league sources…",
  "tool-nbaExtract": "Reading source…",
  "tool-nbaWebSearch": "Scanning the wire…",
  "tool-fillContract": "Filling contract…",
};

function isToolPart(part: UIMessage["parts"][number]): part is ToolPart {
  return part.type.startsWith("tool-");
}

function AttachmentDownloadLink({
  url,
  filename,
  messageId,
  index,
}: {
  url: string;
  filename: string;
  messageId: string;
  index: number;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setError(null);
    setIsDownloading(true);
    try {
      await downloadAttachment(url, filename);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Download failed.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div key={`${messageId}-file-${index}`} className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={isDownloading}
        className="flex items-center gap-2 rounded-md border border-border/50 bg-background/20 px-3 py-2 text-xs transition-colors hover:bg-background/40 disabled:opacity-60"
      >
        {isDownloading ? (
          <Spinner className="size-4 shrink-0" />
        ) : (
          <DownloadIcon className="size-4 shrink-0" />
        )}
        <span className="truncate">{filename}</span>
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FillContractDownload({ output }: { output: FillContractOutput }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setError(null);
    setIsDownloading(true);
    try {
      await downloadAttachment(output.downloadUrl, output.filename);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Download failed.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={isDownloading}
        className="flex w-full items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/20 disabled:opacity-60"
      >
        {isDownloading ? (
          <Spinner className="size-4 shrink-0" />
        ) : (
          <DownloadIcon className="size-4 shrink-0" />
        )}
        <span className="truncate">Download {output.filename}</span>
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
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

  const label = part.filename ?? "Attachment";

  if (part.url) {
    return (
      <AttachmentDownloadLink
        key={`${messageId}-file-${index}`}
        url={part.url}
        filename={label}
        messageId={messageId}
        index={index}
      />
    );
  }

  return (
    <div
      key={`${messageId}-file-${index}`}
      className="flex items-center gap-2 rounded-md border border-border/50 bg-background/20 px-3 py-2 text-xs"
    >
      <PaperclipIcon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
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
    const fillContractDownload =
      part.type === "tool-fillContract" &&
      part.state === "output-available" &&
      isFillContractOutput(part.output) ? (
        <FillContractDownload output={part.output} />
      ) : null;

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
          {fillContractDownload}
          <ToolInput input={part.input} />
          <ToolOutput output={part.output} errorText={part.errorText} />
        </ToolContent>
      </Tool>
    );
  }

  return null;
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const displayMessages = useMemo(
    () =>
      messages.map((message) =>
        message.role === "assistant"
          ? appendFilledContractsToMessage(message)
          : message,
      ),
    [messages],
  );

  return (
    <>
      {displayMessages.map((message) => (
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
