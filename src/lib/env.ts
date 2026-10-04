import "server-only";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable ${name}`);
  return v;
}

export const env = {
  get authSecret() {
    const s = required("AUTH_SECRET");
    if (s.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters");
    return new TextEncoder().encode(s);
  },
  isProd: process.env.NODE_ENV === "production",
};
