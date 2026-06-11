"use client";

import { Button } from "@/components/ui/button";

export const SUGGESTED_PROMPTS = [
  "What's the latest on Lakers trade deadline moves?",
  "Who's the MVP frontrunner right now?",
  "Any injury updates on Joel Embiid?",
  "Where do the Celtics stand in the East?",
];

type SuggestedPromptsProps = {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
};

export function SuggestedPrompts({ onSelect, disabled }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {SUGGESTED_PROMPTS.map((prompt) => (
        <Button
          key={prompt}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="h-auto whitespace-normal px-3 py-2 text-left text-xs"
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
}
