"use client";

import type { ChatStatus } from "ai";
import { PaperclipIcon, XIcon } from "lucide-react";

import {
  PromptInputButton,
  PromptInputSubmit,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";

export function AttachmentChips() {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 pt-3">
      {attachments.files.map((file) => {
        const isImage = file.mediaType?.startsWith("image/");

        return (
          <div
            key={file.id}
            className="flex max-w-full items-center gap-2 rounded-md border border-border/60 bg-muted/50 px-2 py-1 text-xs"
          >
            {isImage && file.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview
              <img
                src={file.url}
                alt={file.filename ?? "Attachment"}
                className="size-8 rounded object-cover"
              />
            ) : (
              <PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate max-w-[12rem]">{file.filename}</span>
            <button
              type="button"
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => attachments.remove(file.id)}
              aria-label={`Remove ${file.filename}`}
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

type AttachmentAddButtonProps = {
  disabled?: boolean;
};

export function AttachmentAddButton({ disabled }: AttachmentAddButtonProps) {
  const attachments = usePromptInputAttachments();

  return (
    <PromptInputButton
      type="button"
      tooltip="Add files"
      disabled={disabled}
      onClick={() => attachments.openFileDialog()}
      aria-label="Add files"
    >
      <PaperclipIcon className="size-4" />
    </PromptInputButton>
  );
}

export function AttachmentDropHint({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Up to 3 files, 5 MB each
    </p>
  );
}

type AttachmentPromptSubmitProps = {
  input: string;
  status?: ChatStatus;
  isUploading?: boolean;
  onStop?: () => void;
};

export function AttachmentPromptSubmit({
  input,
  status,
  isUploading,
  onStop,
}: AttachmentPromptSubmitProps) {
  const attachments = usePromptInputAttachments();
  const hasContent =
    input.trim().length > 0 || attachments.files.length > 0;
  const isGenerating = status === "submitted" || status === "streaming";

  return (
    <PromptInputSubmit
      status={isUploading ? "submitted" : status}
      onStop={onStop}
      disabled={!hasContent && !isGenerating && !isUploading}
    />
  );
}
