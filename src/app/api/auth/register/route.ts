import { NextResponse } from "next/server";
import { getDb, isDbConfigured } from "@/lib/db";
import {
  hashPassword,
  isAuthConfigured,
  issueToken,
  isValidPassword,
  isValidUsername,
} from "@/lib/auth";
import type { Stats } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  username?: string;
  password?: string;
  initialStats?: Stats | null;
}

/**
 * POST /api/auth/register
 * Crea un usuario nuevo. Devuelve { token, username }.
 * Si initialStats viene en el body, se guarda como las stats iniciales del
 * usuario (caso típico: alguien jugó local y ahora se registra → no pierde stats).
 */
export async function POST(req: Request) {
  if (!isDbConfigured() || !isAuthConfigured()) {
    return NextResponse.json(
      { error: "Login en la nube no disponible." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }
  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  if (!isValidUsername(username)) {
    return NextResponse.json(
      { error: "Usuario debe ser 3–16 caracteres (letras, números, . _ -)." },
      { status: 400 },
    );
  }
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "Contraseña debe tener al menos 6 caracteres." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const users = db.collection("users");
  const existing = await users.findOne({ usernameLower: username.toLowerCase() });
  if (existing) {
    return NextResponse.json(
      { error: "Ese usuario ya existe." },
      { status: 409 },
    );
  }

  const passHash = await hashPassword(password);
  const now = new Date();
  const doc = {
    username,
    usernameLower: username.toLowerCase(),
    passHash,
    createdAt: now,
    updatedAt: now,
    stats: body.initialStats ?? null,
    unlocked: [] as string[],
  };
  const res = await users.insertOne(doc);
  const token = await issueToken({
    sub: res.insertedId.toString(),
    username,
  });
  return NextResponse.json({ token, username });
}
