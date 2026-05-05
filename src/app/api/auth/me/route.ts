import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, isDbConfigured } from "@/lib/db";
import { isAuthConfigured, requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/me
 * Devuelve { username, stats, unlocked } si el token es válido.
 * El cliente lo usa al arrancar para validar que el token sigue vivo.
 */
export async function GET(req: Request) {
  if (!isDbConfigured() || !isAuthConfigured()) {
    return NextResponse.json(
      { error: "Login en la nube no disponible." },
      { status: 503 },
    );
  }
  const claims = await requireAuth(req);
  if (!claims) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const db = await getDb();
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(claims.sub) });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }
  return NextResponse.json({
    username: user.username,
    stats: user.stats ?? null,
    unlocked: user.unlocked ?? [],
  });
}
