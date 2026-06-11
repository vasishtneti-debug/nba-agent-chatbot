"use client";

import { ArrowUp } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MessageInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border/60 bg-background/80 p-4 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Drew about trades, injuries, standings…"
          disabled={disabled}
          rows={1}
          className="max-h-40 min-h-11 resize-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !input.trim()}
          className="size-11 shrink-0 rounded-xl"
          aria-label="Send message"
        >
          <ArrowUp className="size-4" />
        </Button>
      </div>
    </form>
  );
}
