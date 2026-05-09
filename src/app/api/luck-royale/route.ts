import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, isDbConfigured } from "@/lib/db";
import { isAuthConfigured, requireAuth } from "@/lib/auth";
import { SPIN_COST } from "@/lib/luck-royale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/luck-royale
 * Devuelve el estado actual del Luck Royale para el usuario logueado:
 * { tickets, unlockedItems, spinCost }.
 */
export async function GET(req: Request) {
  if (!isDbConfigured() || !isAuthConfigured()) {
    return NextResponse.json(
      { error: "Luck Royale no disponible (cloud sync apagado)." },
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
    return NextResponse.json(
      { error: "Usuario no encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    tickets: typeof user.tickets === "number" ? user.tickets : 0,
    unlockedItems: Array.isArray(user.unlockedItems)
      ? (user.unlockedItems as string[])
      : [],
    spinCost: SPIN_COST,
  });
}
