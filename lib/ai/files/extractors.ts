import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import * as XLSX from "xlsx";

const MAX_EXTRACTED_CHARS = 12_000;

function truncateText(text: string) {
  if (text.length <= MAX_EXTRACTED_CHARS) return text;
  return `${text.slice(0, MAX_EXTRACTED_CHARS)}\n\n[Truncated — file exceeded ${MAX_EXTRACTED_CHARS} characters.]`;
}

function extensionFromFilename(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mediaType: string,
  filename: string,
): Promise<string> {
  const ext = extensionFromFilename(filename);

  if (
    mediaType.startsWith("text/") ||
    ext === "csv" ||
    ext === "json" ||
    ext === "md" ||
    ext === "txt"
  ) {
    return truncateText(buffer.toString("utf-8"));
  }

  if (mediaType === "application/pdf" || ext === "pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return truncateText(text);
  }

  if (
    mediaType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return truncateText(result.value);
  }

  if (
    mediaType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mediaType === "application/vnd.ms-excel" ||
    ext === "xlsx" ||
    ext === "xls"
  ) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheets = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      return `### ${name}\n${csv}`;
    });
    return truncateText(sheets.join("\n\n"));
  }

  throw new Error(`Unsupported file type: ${mediaType || ext || "unknown"}`);
}

export function isImageMediaType(mediaType: string) {
  return mediaType.startsWith("image/");
}
