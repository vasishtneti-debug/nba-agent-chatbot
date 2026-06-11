"use client";

import { MessageSquarePlus, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useChats } from "@/hooks/use-chats";
import { cn, formatRelativeTime } from "@/lib/utils";

type ChatSidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function ChatSidebar({ className, onNavigate }: ChatSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { chats, isLoading, removeChat } = useChats();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleNewChat() {
    const res = await fetch("/api/chats", { method: "POST" });
    if (!res.ok) return;
    const { chat } = (await res.json()) as { chat: { id: string } };
    onNavigate?.();
    router.push(`/chat/${chat.id}`);
    router.refresh();
  }

  async function handleDelete(chatId: string) {
    setDeletingId(chatId);
    const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) return;

    removeChat(chatId);
    if (pathname === `/chat/${chatId}`) {
      router.push("/chat");
    }
  }

  return (
    <aside
      className={cn(
        "flex h-full w-[260px] shrink-0 flex-col border-r border-border/60 bg-sidebar",
        className,
      )}
    >
      <div className="p-3">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <MessageSquarePlus className="size-4" />
          New Chat
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-2 py-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">No conversations yet</p>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => {
              const isActive = pathname === `/chat/${chat.id}`;
              return (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-lg pr-1",
                    isActive && "bg-muted",
                  )}
                >
                  <Link
                    href={`/chat/${chat.id}`}
                    onClick={onNavigate}
                    className={cn(
                      "min-w-0 flex-1 truncate px-3 py-2 text-sm transition-colors hover:text-foreground",
                      isActive ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span className="block truncate">{chat.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(chat.updated_at)}
                    </span>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 data-[popup-open]:opacity-100"
                      aria-label="Chat options"
                    >
                      <MoreHorizontal className="size-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={deletingId === chat.id}
                        onClick={() => void handleDelete(chat.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      <Separator />
      <div className="p-2">
        <SignOutButton />
      </div>
    </aside>
  );
}
