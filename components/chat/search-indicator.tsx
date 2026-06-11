"use client";

import type { UIMessage } from "ai";
import { Loader2, Search } from "lucide-react";

import { cn } from "@/lib/utils";

export function SearchIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="size-4 animate-spin text-primary" />
      <Search className="size-4 text-primary" />
      <span>Drew is checking the wire…</span>
    </div>
  );
}

export function isToolSearchPart(part: UIMessage["parts"][number]) {
  return (
    part.type === "tool-nbaWebSearch" ||
    (part.type.startsWith("tool-") && part.type.includes("WebSearch"))
  );
}

export function isToolSearchLoading(part: UIMessage["parts"][number]) {
  if (!isToolSearchPart(part)) return false;
  return (
    "state" in part &&
    (part.state === "input-streaming" ||
      part.state === "input-available" ||
      part.state === "approval-requested")
  );
}
