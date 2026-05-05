import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, isDbConfigured } from "@/lib/db";
import { isAuthConfigured, requireAuth } from "@/lib/auth";
import type { AchievementId, Stats } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  stats?: Stats;
  unlocked?: AchievementId[];
}

function bad(reason: string, status = 400) {
  return NextResponse.json({ error: reason }, { status });
}

/**
 * GET /api/stats
 * Devuelve { stats, unlocked } guardados en la nube para el usuario logueado.
 */
export async function GET(req: Request) {
  if (!isDbConfigured() || !isAuthConfigured()) return bad("Disabled.", 503);
  const claims = await requireAuth(req);
  if (!claims) return bad("No autenticado.", 401);
  const db = await getDb();
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(claims.sub) });
  if (!user) return bad("Usuario no encontrado.", 404);
  return NextResponse.json({
    stats: user.stats ?? null,
    unlocked: user.unlocked ?? [],
  });
}

/**
 * PUT /api/stats  body: { stats, unlocked }
 * Sobrescribe las stats del usuario logueado. La política simple es
 * "lo último gana": el cliente manda el merge ya hecho con los datos locales.
 */
export async function PUT(req: Request) {
  if (!isDbConfigured() || !isAuthConfigured()) return bad("Disabled.", 503);
  const claims = await requireAuth(req);
  if (!claims) return bad("No autenticado.", 401);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad("Body inválido.");
  }
  if (!body.stats) return bad("Falta stats.");

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(claims.sub) },
    {
      $set: {
        stats: body.stats,
        unlocked: body.unlocked ?? [],
        updatedAt: new Date(),
      },
    },
  );
  return NextResponse.json({ ok: true });
}
