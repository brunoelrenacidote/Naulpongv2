import { NextResponse } from "next/server";
import { getDb, isDbConfigured } from "@/lib/db";
import {
  isAuthConfigured,
  issueToken,
  isValidPassword,
  isValidUsername,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  username?: string;
  password?: string;
}

/**
 * POST /api/auth/login
 * Devuelve { token, username }. 401 si las credenciales no coinciden.
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
  if (!isValidUsername(username) || !isValidPassword(password)) {
    return NextResponse.json(
      { error: "Usuario o contraseña inválidos." },
      { status: 401 },
    );
  }

  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ usernameLower: username.toLowerCase() });
  if (!user) {
    return NextResponse.json(
      { error: "Usuario o contraseña inválidos." },
      { status: 401 },
    );
  }
  const ok = await verifyPassword(password, user.passHash as string);
  if (!ok) {
    return NextResponse.json(
      { error: "Usuario o contraseña inválidos." },
      { status: 401 },
    );
  }

  const token = await issueToken({
    sub: user._id.toString(),
    username: user.username as string,
  });
  return NextResponse.json({ token, username: user.username });
}
