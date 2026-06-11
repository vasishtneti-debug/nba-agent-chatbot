import { get } from "@vercel/blob";

import { getBlobAccess, getBlobReadWriteToken } from "@/lib/env/blob";

export async function readBlobBytes(blobPathname: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const result = await get(blobPathname, {
      access: getBlobAccess(),
      token: getBlobReadWriteToken(),
      abortSignal: controller.signal,
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error(
        "File could not be read from storage. It may not have been uploaded successfully.",
      );
    }

    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Timed out reading file from storage.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
