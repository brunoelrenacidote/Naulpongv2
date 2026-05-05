import { MongoClient } from "mongodb";

/**
 * Cliente Mongo cacheado a nivel de módulo. Esto evita abrir una conexión
 * nueva por cada request en dev (Next route handlers se re-evalúan con HMR).
 *
 * Si MONGODB_URI no está seteado, las API routes que lo usen deberán
 * devolver 503 — el resto de la app sigue funcionando con localStorage.
 */

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB ?? "naulpong";

interface GlobalWithMongo {
  _naulpongMongo?: Promise<MongoClient> | null;
}
const g = globalThis as GlobalWithMongo;

export function isDbConfigured(): boolean {
  return Boolean(URI);
}

export async function getDb() {
  if (!URI) {
    throw new Error(
      "MONGODB_URI no está configurado. Login en la nube no disponible.",
    );
  }
  if (!g._naulpongMongo) {
    const client = new MongoClient(URI, {
      // Tolerante a la primera conexión lenta de Atlas free tier.
      serverSelectionTimeoutMS: 8000,
    });
    g._naulpongMongo = client.connect();
  }
  const client = await g._naulpongMongo;
  return client.db(DB_NAME);
}
