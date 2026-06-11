"use client";

import { useCallback, useEffect, useState } from "react";

import type { Tables } from "@/lib/supabase/database.types";

export function useChats() {
  const [chats, setChats] = useState<Tables<"chats">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chats");
      if (!res.ok) {
        throw new Error("Failed to load chats");
      }
      const data = (await res.json()) as { chats: Tables<"chats">[] };
      setChats(data.chats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchChats();
  }, [fetchChats]);

  const addChat = useCallback((chat: Tables<"chats">) => {
    setChats((prev) => [chat, ...prev.filter((c) => c.id !== chat.id)]);
  }, []);

  const removeChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
  }, []);

  const updateChatInList = useCallback((chat: Tables<"chats">) => {
    setChats((prev) => {
      const filtered = prev.filter((c) => c.id !== chat.id);
      return [chat, ...filtered];
    });
  }, []);

  return {
    chats,
    isLoading,
    error,
    refetch: fetchChats,
    addChat,
    removeChat,
    updateChatInList,
  };
}
