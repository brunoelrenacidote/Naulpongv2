export function partyHost(): string {
  if (typeof window !== "undefined") {
    const fromEnv = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
    if (fromEnv && fromEnv.length > 0) return fromEnv;
    // local dev fallback
    return "127.0.0.1:1999";
  }
  return process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999";
}
