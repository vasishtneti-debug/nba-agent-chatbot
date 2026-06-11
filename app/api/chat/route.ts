import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { CHAT_MODEL, MAX_TOOL_STEPS } from "@/lib/ai/models";
import { DREW_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { getNbaWebSearch } from "@/lib/ai/tools/web-search";
import { getChat, updateChatTitle } from "@/lib/db/chats";
import { saveMessage } from "@/lib/db/messages";
import { createMessageId } from "@/lib/ids";
import { createClient, getUser } from "@/lib/supabase/server";
import { truncate } from "@/lib/utils";

export const maxDuration = 60;

const messageListSchema = z.array(z.custom<UIMessage>());

function getTextFromMessage(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const chatId = z.string().uuid().parse(json.chatId);
    const messages = messageListSchema.parse(json.messages);

    const supabase = await createClient();
    const chat = await getChat(supabase, chatId, user.id);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const lastMessage = messages.at(-1);
    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json({ error: "Last message must be from user" }, { status: 400 });
    }

    await saveMessage(supabase, chatId, lastMessage);

    const isFirstUserMessage = messages.filter((m) => m.role === "user").length === 1;
    if (isFirstUserMessage && chat.title === "New Chat") {
      const title = truncate(getTextFromMessage(lastMessage), 60);
      await updateChatTitle(supabase, chatId, user.id, title);
    }

    const nbaWebSearch = getNbaWebSearch();

    const modelMessages = await convertToModelMessages(messages, {
      tools: { nbaWebSearch },
    });

    const result = streamText({
      model: CHAT_MODEL,
      system: DREW_SYSTEM_PROMPT,
      messages: modelMessages,
      tools: { nbaWebSearch },
      stopWhen: stepCountIs(MAX_TOOL_STEPS),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: createMessageId,
      onFinish: async ({ responseMessage }) => {
        await saveMessage(supabase, chatId, responseMessage);
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (
      error instanceof Error &&
      error.message.includes("TAVILY_API_KEY")
    ) {
      return NextResponse.json(
        { error: "Web search is not configured. Set TAVILY_API_KEY." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
