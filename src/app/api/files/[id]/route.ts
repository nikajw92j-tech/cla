import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { readStoredFile } from "@/lib/uploads";

export const dynamic = "force-dynamic";

/**
 * Authorized file download. A user may read a file if they uploaded it, if it is attached
 * to something they own (e.g. an admin preview on their website or a staff reply in their
 * thread/ticket), if it's an avatar, or if they are an admin.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const file = await db.fileUpload.findUnique({
    where: { id },
    include: {
      order: { select: { userId: true } },
      request: { select: { userId: true } },
      website: { select: { userId: true } },
      message: { select: { thread: { select: { userId: true } } } },
      ticketReply: { select: { ticket: { select: { userId: true } } } },
    },
  });
  if (!file) return new NextResponse("Not found", { status: 404 });

  const allowed =
    user.role === "ADMIN" ||
    file.userId === user.id ||
    file.purpose === "AVATAR" ||
    file.order?.userId === user.id ||
    file.request?.userId === user.id ||
    file.website?.userId === user.id ||
    file.message?.thread.userId === user.id ||
    file.ticketReply?.ticket.userId === user.id;
  if (!allowed) return new NextResponse("Not found", { status: 404 });

  let data: Buffer;
  try {
    data = await readStoredFile(file.storedName);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  const inline = file.mimeType.startsWith("image/") || file.mimeType === "application/pdf";
  const download = new URL(req.url).searchParams.has("download");
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(data.length),
      "Content-Disposition": `${inline && !download ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
