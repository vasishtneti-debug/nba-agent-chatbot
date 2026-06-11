import type { UIMessage } from "ai";

type ToolPart = UIMessage["parts"][number] & {
  type: `tool-${string}`;
  state: string;
  output?: unknown;
};

export type FillContractOutput = {
  success: true;
  downloadUrl: string;
  filename: string;
  mediaType: string;
};

export function isFillContractOutput(
  output: unknown,
): output is FillContractOutput {
  if (!output || typeof output !== "object") return false;
  const value = output as Record<string, unknown>;
  return (
    value.success === true &&
    typeof value.downloadUrl === "string" &&
    typeof value.filename === "string" &&
    typeof value.mediaType === "string"
  );
}

export function appendFilledContractsToMessage(message: UIMessage): UIMessage {
  const existingFileUrls = new Set(
    message.parts
      .filter((part) => part.type === "file")
      .map((part) => part.url),
  );

  const fileParts = message.parts
    .filter((part): part is ToolPart => part.type === "tool-fillContract")
    .filter((part) => part.state === "output-available")
    .map((part) => part.output)
    .filter(isFillContractOutput)
    .filter((output) => !existingFileUrls.has(output.downloadUrl))
    .map((output) => ({
      type: "file" as const,
      url: output.downloadUrl,
      filename: output.filename,
      mediaType: output.mediaType,
    }));

  if (fileParts.length === 0) return message;

  return {
    ...message,
    parts: [...message.parts, ...fileParts],
  };
}
