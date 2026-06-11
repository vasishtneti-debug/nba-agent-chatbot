import { extractTextFromBuffer } from "@/lib/ai/files/extractors";

import { applyReplacements, detectPlaceholders } from "./placeholders";

function extensionFromFilename(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
}

function filledFilename(filename: string) {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return `filled-${filename}`;
  const base = filename.slice(0, dot);
  const ext = filename.slice(dot);
  return `${base}-filled${ext}`;
}

function filledTextFilename(filename: string) {
  const dot = filename.lastIndexOf(".");
  const base = dot >= 0 ? filename.slice(0, dot) : filename;
  return `${base}-filled.txt`;
}

async function fillDocxBuffer(buffer: Buffer, replacements: Record<string, string>) {
  const { default: PizZip } = await import("pizzip");
  const zip = new PizZip(buffer);

  for (const [path, file] of Object.entries(zip.files)) {
    if (!path.endsWith(".xml") || file.dir) continue;
    const xml = file.asText();
    const filled = applyReplacements(xml, replacements);
    zip.file(path, filled);
  }

  return zip.generate({ type: "nodebuffer" }) as Buffer;
}

async function fillPdfFormBuffer(buffer: Buffer, replacements: Record<string, string>) {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const form = pdf.getForm();
  const fields = form.getFields();

  if (fields.length === 0) {
    return null;
  }

  for (const field of fields) {
    const name = field.getName();
    const value =
      replacements[name] ??
      Object.entries(replacements).find(
        ([key]) => key.toLowerCase() === name.toLowerCase(),
      )?.[1];

    if (!value) continue;

    try {
      const textField = form.getTextField(name);
      textField.setText(value);
      continue;
    } catch {
      // Not a text field — try other field types below.
    }

    try {
      const dropdown = form.getDropdown(name);
      dropdown.select(value);
      continue;
    } catch {
      // Not a dropdown.
    }

    try {
      const optionList = form.getOptionList(name);
      optionList.select(value);
    } catch {
      // Unsupported field type for this value.
    }
  }

  form.flatten();
  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

async function fillTextBuffer(
  buffer: Buffer,
  mediaType: string,
  filename: string,
  replacements: Record<string, string>,
) {
  const text = await extractTextFromBuffer(buffer, mediaType, filename);
  const filled = applyReplacements(text, replacements);
  return {
    buffer: Buffer.from(filled, "utf-8"),
    mediaType: "text/plain",
    filename: filledTextFilename(filename),
  };
}

export type FillContractResult = {
  buffer: Buffer;
  mediaType: string;
  filename: string;
  detectedPlaceholders: string[];
  filledFields: string[];
  method: "docx" | "pdf-form" | "text";
  notes: string[];
};

export async function fillContractDocument(
  buffer: Buffer,
  mediaType: string,
  filename: string,
  replacements: Record<string, string>,
): Promise<FillContractResult> {
  const ext = extensionFromFilename(filename);
  const extractedText = await extractTextFromBuffer(buffer, mediaType, filename);
  const detectedPlaceholders = detectPlaceholders(extractedText);
  const filledFields = Object.keys(replacements).filter((key) => replacements[key]);

  const notes: string[] = [];

  if (ext === "docx" || mediaType.includes("wordprocessingml")) {
    const filledBuffer = await fillDocxBuffer(buffer, replacements);
    return {
      buffer: filledBuffer,
      mediaType,
      filename: filledFilename(filename),
      detectedPlaceholders,
      filledFields,
      method: "docx",
      notes,
    };
  }

  if (ext === "pdf" || mediaType === "application/pdf") {
    const pdfFormResult = await fillPdfFormBuffer(buffer, replacements);
    if (pdfFormResult) {
      return {
        buffer: pdfFormResult,
        mediaType,
        filename: filledFilename(filename),
        detectedPlaceholders,
        filledFields,
        method: "pdf-form",
        notes,
      };
    }

    notes.push(
      "PDF had no fillable form fields — generated a filled plain-text version instead.",
    );
    const textResult = await fillTextBuffer(buffer, mediaType, filename, replacements);
    return {
      ...textResult,
      detectedPlaceholders,
      filledFields,
      method: "text",
      notes,
    };
  }

  const textResult = await fillTextBuffer(buffer, mediaType, filename, replacements);
  return {
    ...textResult,
    detectedPlaceholders,
    filledFields,
    method: "text",
    notes,
  };
}
