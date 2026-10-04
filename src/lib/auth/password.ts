import "server-only";
import bcrypt from "bcryptjs";

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

// A real hash used to keep login timing identical when the email doesn't exist.
let dummy: Promise<string> | null = null;
export async function verifyAgainstDummy(pw: string) {
  dummy ??= bcrypt.hash("timing-equalizer-password", 12);
  await bcrypt.compare(pw, await dummy);
  return false;
}
