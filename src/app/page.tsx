import Link from "next/link";
import HomeActions from "@/components/HomeActions";
import CharacterPreview from "@/components/CharacterPreview";

export default function Home() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-start gap-8 px-6 py-10 text-center sm:gap-12 sm:py-14">
      <header className="mt-2 flex flex-col items-center gap-2 sm:mt-4 sm:gap-3">
        <p className="font-press text-[10px] uppercase tracking-[0.4em] text-white/40 sm:text-[11px]">
          Arcade · Online · 1v1
        </p>
        <h1 className="title-glow text-5xl leading-none sm:text-6xl md:text-7xl">
          NauL<span className="inline-block px-1">Pong</span>
        </h1>
        <p className="font-vt text-lg text-white/70 sm:text-xl">
          Pong con poderes. Primero a 7 gana.
        </p>
      </header>

      <section className="flex w-full max-w-md items-center justify-center gap-6 sm:gap-12">
        <div className="flex flex-col items-center gap-2">
          <CharacterPreview id="hijo-fiesta" scale={4} glow="#5cffc8" />
          <p className="font-press text-[8px] tracking-widest text-[var(--neon-cyan)] sm:text-[9px]">
            EL WEY DE
            <br />
            LAS FIESTAS
          </p>
        </div>
        <div className="font-press flex flex-col items-center">
          <span
            className="text-xl text-white/40 sm:text-2xl"
            style={{ letterSpacing: "0.2em" }}
          >
            VS
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <CharacterPreview id="clavel" scale={4} glow="#ff5c8a" />
          <p className="font-press text-[8px] tracking-widest text-[var(--neon-pink)] sm:text-[9px]">
            EL CLAVEL
          </p>
        </div>
      </section>

      <HomeActions />

      <footer className="font-vt mt-auto flex flex-col items-center gap-1 pt-12 text-center text-sm text-white/40">
        <p>© NauLPong</p>
        <Link href="/about" className="underline hover:text-white/80">
          Cómo se juega
        </Link>
      </footer>
    </main>
  );
}
