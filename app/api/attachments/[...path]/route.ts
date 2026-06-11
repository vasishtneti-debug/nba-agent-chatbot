import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

import { parseAttachmentProxyPath } from "@/lib/attachments/constants";
import { getAttachmentByPathname } from "@/lib/db/attachments";
import { getBlobReadWriteToken } from "@/lib/env/blob";
import { createClient, getUser } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await context.params;
  const parsed = parseAttachmentProxyPath(path);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (parsed.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const attachment = await getAttachmentByPathname(
    supabase,
    parsed.blobPathname,
    user.id,
  );

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await get(parsed.blobPathname, {
    access: "private",
    token: getBlobReadWriteToken(),
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": attachment.media_type,
      "Content-Disposition": `inline; filename="${attachment.filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
