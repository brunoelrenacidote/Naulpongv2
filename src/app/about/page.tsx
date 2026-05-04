import Link from "next/link";
import { POWER_EMOJIS, POWER_LABELS } from "@/lib/game-types";

export default function About() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="title-glow text-3xl">CÓMO SE JUEGA</h1>

      <section className="font-vt space-y-3 text-lg leading-relaxed text-white/85">
        <p>
          NauLPong es un Pong 1v1 online con poderes que aparecen aleatoriamente
          en la cancha. El primer jugador en llegar a <b>7 puntos</b> gana.
        </p>
        <p>
          Cuando la pelota toca un orbe de poder, el último que la tocó se queda
          con el efecto. Algunos te dan ventaja, otros le complican la vida al
          rival.
        </p>
        <p>
          Cada partida asigna aleatoriamente a los dos personajes de cada lado:{" "}
          <span className="glow-cyan">El wey que va por su hijo a las fiestas</span> y{" "}
          <span className="glow-pink">El Clavel</span>.
        </p>
      </section>

      <h2 className="font-press mt-4 text-base">CONTROLES</h2>
      <ul className="font-vt list-disc space-y-1 pl-6 text-lg text-white/85">
        <li>
          Teclado: <b>↑/↓</b> o <b>W/S</b> para mover la paleta.
        </li>
        <li>Mobile: tocá la mitad superior o inferior de la pantalla.</li>
      </ul>

      <h2 className="font-press mt-4 text-base">LOS 8 PODERES</h2>
      <ul className="font-vt grid grid-cols-1 gap-2 text-lg text-white/85 sm:grid-cols-2">
        {Object.entries(POWER_LABELS).map(([id, label]) => (
          <li key={id} className="flex items-center gap-3">
            <span className="text-2xl">
              {POWER_EMOJIS[id as keyof typeof POWER_EMOJIS]}
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ul>

      <h2 className="font-press mt-4 text-base">MODOS</h2>
      <ul className="font-vt list-disc space-y-1 pl-6 text-lg text-white/85">
        <li>⚡ <b>Partida Rápida</b> — entrás a la cola y te emparejamos con un rival.</li>
        <li>🎮 <b>Crear Sala</b> — generás un código y se lo pasás a un amigo.</li>
        <li>🔑 <b>Unirse con Código</b> — entrás a la sala de un amigo.</li>
      </ul>

      <Link href="/" className="btn-arcade mt-4 self-start">
        ← VOLVER
      </Link>
    </main>
  );
}
