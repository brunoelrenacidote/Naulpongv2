import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, isDbConfigured } from "@/lib/db";
import { isAuthConfigured, requireAuth } from "@/lib/auth";
import { rollLuckRoyale, SPIN_COST } from "@/lib/luck-royale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/luck-royale/spin
 *
 * Cobra `SPIN_COST` boletos al usuario y tira el dado del Luck Royale.
 * Server-authoritative: el roll y el tracking de inventory se hacen
 * acá, no en el cliente.
 */
export async function POST(req: Request) {
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
  const users = db.collection("users");
  const _id = new ObjectId(claims.sub);
  const user = await users.findOne({ _id });
  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado." },
      { status: 404 },
    );
  }

  const tickets = typeof user.tickets === "number" ? user.tickets : 0;
  const unlocked = Array.isArray(user.unlockedItems)
    ? (user.unlockedItems as string[])
    : [];

  if (tickets < SPIN_COST) {
    return NextResponse.json(
      {
        error: `Boletos insuficientes. Necesitás ${SPIN_COST}.`,
        tickets,
      },
      { status: 402 },
    );
  }

  const outcome = rollLuckRoyale(new Set(unlocked));
  const isCollectible = outcome.item.type !== "bonus";
  const wasNew = isCollectible && !outcome.duplicate;

  const newUnlocked = wasNew ? [...unlocked, outcome.item.id] : unlocked;
  const newTickets =
    tickets - SPIN_COST + (outcome.ticketsRefunded ?? 0);

  await users.updateOne(
    { _id },
    {
      $set: {
        tickets: newTickets,
        unlockedItems: newUnlocked,
        updatedAt: new Date(),
      },
    },
  );

  return NextResponse.json({
    item: outcome.item,
    duplicate: outcome.duplicate,
    ticketsRefunded: outcome.ticketsRefunded,
    newTickets,
    unlockedItems: newUnlocked,
  });
}
