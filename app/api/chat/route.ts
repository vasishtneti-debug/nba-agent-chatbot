import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  collectBlobPathnamesFromMessage,
  processMessageFiles,
} from "@/lib/ai/files/process-attachments";
import { CHAT_MODEL, MAX_TOOL_STEPS } from "@/lib/ai/models";
import { DREW_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { getNbaSearchTools } from "@/lib/ai/tools/web-search";
import { linkAttachmentsToMessage } from "@/lib/db/attachments";
import { getChat, updateChatTitle } from "@/lib/db/chats";
import { saveMessage } from "@/lib/db/messages";
import { createMessageId } from "@/lib/ids";
import { createClient, getUser } from "@/lib/supabase/server";
import { truncate } from "@/lib/utils";

export const maxDuration = 60;

const messageListSchema = z.array(z.custom<UIMessage>());

function getTextFromMessage(message: UIMessage) {
  const textParts = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  const fileParts = message.parts
    .filter((part) => part.type === "file")
    .map((part) => part.filename ?? "file")
    .join(", ");

  if (textParts && fileParts) {
    return `${textParts} [${fileParts}]`;
  }

  return textParts || (fileParts ? `Attachment: ${fileParts}` : "");
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

    const savedUserMessage = await saveMessage(supabase, chatId, lastMessage);

    const blobPathnames = collectBlobPathnamesFromMessage(lastMessage);
    if (blobPathnames.length > 0) {
      await linkAttachmentsToMessage(
        supabase,
        blobPathnames,
        savedUserMessage.id,
        user.id,
      );
    }

    const isFirstUserMessage = messages.filter((m) => m.role === "user").length === 1;
    if (isFirstUserMessage && chat.title === "New Chat") {
      const title = truncate(getTextFromMessage(lastMessage), 60);
      await updateChatTitle(supabase, chatId, user.id, title);
    }

    const searchTools = getNbaSearchTools();
    const messagesForModel = await processMessageFiles(supabase, messages, user.id);

    const modelMessages = await convertToModelMessages(messagesForModel, {
      tools: searchTools,
    });

    const result = streamText({
      model: CHAT_MODEL,
      system: DREW_SYSTEM_PROMPT,
      messages: modelMessages,
      tools: searchTools,
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
    if (
      error instanceof Error &&
      error.message.includes("BLOB_READ_WRITE_TOKEN")
    ) {
      return NextResponse.json(
        { error: "File storage is not configured. Set BLOB_READ_WRITE_TOKEN." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
