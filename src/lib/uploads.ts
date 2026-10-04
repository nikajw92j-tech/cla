import "server-only";
import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Extension -> stored MIME type. Files live outside /public with random names
// and are only served through the authorized /api/files/[id] route.
const ALLOWED: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  zip: "application/zip",
};
const IMAGE_EXT = ["png", "jpg", "jpeg", "webp", "gif"];

/** Magic-number check so a renamed executable can't pass as an image/document. */
function sniff(buf: Buffer, ext: string) {
  const hex = buf.subarray(0, 8).toString("hex");
  switch (ext) {
    case "png":
      return hex.startsWith("89504e47");
    case "jpg":
    case "jpeg":
      return hex.startsWith("ffd8ff");
    case "gif":
      return hex.startsWith("47494638");
    case "webp":
      return buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP";
    case "pdf":
      return buf.subarray(0, 4).toString() === "%PDF";
    case "zip":
    case "docx":
      return hex.startsWith("504b0304");
    case "doc":
      return hex.startsWith("d0cf11e0");
    default:
      return true;
  }
}

export type UploadPurpose = "ORDER" | "REQUEST" | "MESSAGE" | "AVATAR" | "PREVIEW" | "TICKET";
type Links = { orderId?: string; requestId?: string; messageId?: string; websiteId?: string; ticketReplyId?: string };

export function filesFrom(fd: FormData, field = "files") {
  return fd
    .getAll(field)
    .filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f && (f as File).size > 0);
}

export function validateFiles(files: File[], max: number, imagesOnly = false): string | null {
  if (files.length > max) return "errors.tooManyFiles";
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) return "errors.fileTooLarge";
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED[ext] || (imagesOnly && !IMAGE_EXT.includes(ext))) return "errors.fileType";
  }
  return null;
}

export class UploadError extends Error {}

export async function saveFiles(userId: string, files: File[], purpose: UploadPurpose, links: Links = {}) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const prepared = [];
  for (const f of files) {
    const ext = f.name.split(".").pop()!.toLowerCase();
    const buf = Buffer.from(await f.arrayBuffer());
    if (!sniff(buf, ext)) throw new UploadError("errors.fileType");
    prepared.push({ f, ext, buf });
  }
  const saved = [];
  for (const { f, ext, buf } of prepared) {
    const storedName = `${randomBytes(16).toString("hex")}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, storedName), buf);
    saved.push(
      await db.fileUpload.create({
        data: {
          userId,
          purpose,
          storedName,
          originalName: f.name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120),
          mimeType: ALLOWED[ext],
          size: f.size,
          ...links,
        },
      }),
    );
  }
  return saved;
}

const SAFE_NAME = /^[a-f0-9]{32}\.[a-z]+$/;

export async function readStoredFile(storedName: string) {
  if (!SAFE_NAME.test(storedName)) throw new Error("bad name");
  return readFile(path.join(UPLOAD_DIR, storedName));
}

export async function deleteStoredFile(storedName: string) {
  if (!SAFE_NAME.test(storedName)) return;
  await unlink(path.join(UPLOAD_DIR, storedName)).catch(() => {});
}
