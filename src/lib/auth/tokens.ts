import "server-only";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

type TokenType = "VERIFY_EMAIL" | "RESET_PASSWORD";
const TTL: Record<TokenType, number> = { VERIFY_EMAIL: 1000 * 60 * 60 * 48, RESET_PASSWORD: 1000 * 60 * 30 };

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

/** Issues a single-use token. Only its hash is stored. */
export async function issueToken(userId: string, type: TokenType) {
  const raw = randomBytes(32).toString("base64url");
  await db.authToken.deleteMany({ where: { userId, type, usedAt: null } });
  await db.authToken.create({
    data: { userId, type, tokenHash: hash(raw), expiresAt: new Date(Date.now() + TTL[type]) },
  });
  return raw;
}

/** Atomically consumes a token, returning the userId or null if invalid/expired/used. */
export async function consumeToken(raw: string, type: TokenType) {
  if (!raw || raw.length > 200) return null;
  const record = await db.authToken.findUnique({ where: { tokenHash: hash(raw) } });
  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) return null;
  const { count } = await db.authToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return count === 1 ? record.userId : null;
}
