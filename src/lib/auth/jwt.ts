// Edge-safe JWT helpers (used by middleware and server code).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "nx_session";
export type SessionClaims = { sub: string; v: number; role: string };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (>= 32 chars)");
  return new TextEncoder().encode(s);
}

export async function signSession(claims: SessionClaims, maxAgeSec: number) {
  return new SignJWT({ v: claims.v, role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSec)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub, v: Number(payload.v), role: String(payload.role) };
  } catch {
    return null;
  }
}
