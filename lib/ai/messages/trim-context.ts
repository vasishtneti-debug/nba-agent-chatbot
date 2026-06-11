import type { UIMessage } from "ai";

/** Max user+assistant turns kept when calling the model. */
export const MAX_MESSAGES_FOR_MODEL = 20;

const MAX_TOOL_OUTPUT_CHARS = 2_000;
const MAX_SEARCH_RESULT_CONTENT_CHARS = 400;

type ToolPart = UIMessage["parts"][number] & {
  type: `tool-${string}`;
  state: string;
  output?: unknown;
};

function isToolPart(part: UIMessage["parts"][number]): part is ToolPart {
  return part.type.startsWith("tool-");
}

function compactSearchResult(result: unknown) {
  if (!result || typeof result !== "object") return result;
  const record = result as Record<string, unknown>;
  const content =
    typeof record.content === "string"
      ? record.content.slice(0, MAX_SEARCH_RESULT_CONTENT_CHARS)
      : record.content;
  const rawContent =
    typeof record.rawContent === "string"
      ? record.rawContent.slice(0, MAX_SEARCH_RESULT_CONTENT_CHARS)
      : record.rawContent;

  return {
    title: record.title,
    url: record.url,
    content,
    rawContent,
    score: record.score,
  };
}

export function compactToolOutput(output: unknown): unknown {
  if (output == null) return output;

  if (typeof output === "object" && !Array.isArray(output)) {
    const record = output as Record<string, unknown>;

    if (record.success === true && typeof record.downloadUrl === "string") {
      return {
        success: true,
        filename: record.filename,
        method: record.method,
        filledFields: record.filledFields,
        notes: record.notes,
      };
    }

    if (Array.isArray(record.results)) {
      const results = record.results.slice(0, 3).map(compactSearchResult);
      return {
        ...record,
        results,
        answer:
          typeof record.answer === "string"
            ? record.answer.slice(0, MAX_TOOL_OUTPUT_CHARS)
            : record.answer,
        _truncated:
          record.results.length > 3
            ? `Compacted to 3 of ${record.results.length} results for context limit.`
            : undefined,
      };
    }
  }

  const serialized = JSON.stringify(output);
  if (serialized.length <= MAX_TOOL_OUTPUT_CHARS) return output;

  return {
    _compact: `${serialized.slice(0, MAX_TOOL_OUTPUT_CHARS)}… [truncated for context limit]`,
  };
}

function compactAssistantMessage(message: UIMessage): UIMessage {
  return {
    ...message,
    parts: message.parts.map((part) => {
      if (!isToolPart(part) || part.state !== "output-available") return part;
      return { ...part, output: compactToolOutput(part.output) };
    }),
  };
}

export function trimMessagesForModel(messages: UIMessage[]): UIMessage[] {
  const recent =
    messages.length > MAX_MESSAGES_FOR_MODEL
      ? messages.slice(-MAX_MESSAGES_FOR_MODEL)
      : messages;

  return recent.map((message) =>
    message.role === "assistant" ? compactAssistantMessage(message) : message,
  );
}

export function isContextLengthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("context_length_exceeded") ||
    message.includes("context window") ||
    message.includes("maximum context length")
  );
}
