import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const SECRET = process.env.JWT_SECRET;
const ENCODER = new TextEncoder();

function key(): Uint8Array {
  if (!SECRET) {
    throw new Error("JWT_SECRET no está configurado en el entorno.");
  }
  return ENCODER.encode(SECRET);
}

export function isAuthConfigured(): boolean {
  return Boolean(SECRET);
}

export interface AuthClaims {
  sub: string; // user id (mongo _id stringified)
  username: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function issueToken(claims: AuthClaims): Promise<string> {
  return new SignJWT({ username: claims.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
}

export async function verifyToken(token: string): Promise<AuthClaims | null> {
  try {
    const { payload } = await jwtVerify(token, key());
    if (!payload.sub || typeof payload.username !== "string") return null;
    return { sub: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

export function getBearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export async function requireAuth(req: Request): Promise<AuthClaims | null> {
  const token = getBearer(req);
  if (!token) return null;
  return verifyToken(token);
}

const USERNAME_RE = /^[A-Za-z0-9._-]{3,16}$/;
export function isValidUsername(u: string): boolean {
  return USERNAME_RE.test(u);
}

export function isValidPassword(p: string): boolean {
  return typeof p === "string" && p.length >= 6 && p.length <= 64;
}
