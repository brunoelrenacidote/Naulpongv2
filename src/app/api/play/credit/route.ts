import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, isDbConfigured } from "@/lib/db";
import { isAuthConfigured, requireAuth } from "@/lib/auth";
import { CREDIT_COOLDOWN_MS, ticketsForMatch } from "@/lib/luck-royale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  won?: boolean;
}

/**
 * POST /api/play/credit  body: { won: boolean }
 *
 * Acredita boletos al usuario logueado por completar una partida.
 * Server-authoritative: aplica un cooldown de 30s entre créditos para
 * evitar que un cliente manipulado spamee el endpoint.
 *
 * +1 boleto siempre, +1 extra si ganó.
 */
export async function POST(req: Request) {
  if (!isDbConfigured() || !isAuthConfigured()) {
    return NextResponse.json(
      { error: "Cloud sync no disponible." },
      { status: 503 },
    );
  }
  const claims = await requireAuth(req);
  if (!claims) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }
  const won = Boolean(body.won);

  const db = await getDb();
  const users = db.collection("users");
  const _id = new ObjectId(claims.sub);
  const user = await users.findOne({ _id });
  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado." },
      { status: 404 },
    );
  }

  const now = Date.now();
  const last =
    user.lastCreditAt instanceof Date ? user.lastCreditAt.getTime() : 0;
  const elapsed = now - last;
  const currentTickets =
    typeof user.tickets === "number" ? user.tickets : 0;

  if (elapsed < CREDIT_COOLDOWN_MS) {
    // Cooldown activo: no acreditamos pero devolvemos el balance actual.
    return NextResponse.json({
      tickets: currentTickets,
      delta: 0,
      cooldown: CREDIT_COOLDOWN_MS - elapsed,
    });
  }

  const delta = ticketsForMatch(won);
  const newTickets = currentTickets + delta;
  await users.updateOne(
    { _id },
    {
      $set: {
        tickets: newTickets,
        lastCreditAt: new Date(now),
        updatedAt: new Date(now),
      },
    },
  );

  return NextResponse.json({ tickets: newTickets, delta });
}
