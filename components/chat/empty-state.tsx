"use client";

import Image from "next/image";

import { SuggestedPrompts } from "@/components/chat/suggested-prompts";

type EmptyStateProps = {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
};

export function EmptyState({ onSelectPrompt, disabled }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <div className="relative size-16 overflow-hidden rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background">
        <Image src="/drew-logo.svg" alt="Drew" width={64} height={64} className="size-full" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          I&apos;m Drew — your NBA agent on the inside.
        </h2>
        <p className="text-sm text-muted-foreground">
          Trades, injuries, standings, contract leverage — ask me anything happening
          in the league right now. I&apos;ll hit the wire when I need fresh intel.
        </p>
      </div>
      <SuggestedPrompts onSelect={onSelectPrompt} disabled={disabled} />
    </div>
  );
}
