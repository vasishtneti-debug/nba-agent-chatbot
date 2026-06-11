export async function downloadAttachment(url: string, filename: string) {
  const response = await fetch(url, { credentials: "same-origin" });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      // Response body was not JSON — keep statusText.
    }
    throw new Error(`Download failed (${response.status}): ${detail}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
