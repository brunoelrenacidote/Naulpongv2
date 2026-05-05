import HomeActions from "@/components/HomeActions";
import CharacterPreview from "@/components/CharacterPreview";
import StatsBadges from "@/components/StatsBadges";

export default function Home() {
  return (
    <main className="has-bottom-nav safe-pt relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-start gap-5 px-4 pt-8 text-center sm:gap-8 sm:px-6 sm:pt-12">
      <header className="flex flex-col items-center gap-1 sm:gap-2">
        <p className="font-press text-[9px] uppercase tracking-[0.4em] text-white/40 sm:text-[11px]">
          Arcade · Online · 1v1
        </p>
        <h1 className="title-glow text-5xl leading-none sm:text-6xl md:text-7xl">
          NauL<span className="inline-block px-1">Pong</span>
        </h1>
        <p className="font-vt text-base text-white/70 sm:text-xl">
          Pong con poderes. Primero a 7 gana.
        </p>
      </header>

      <StatsBadges />

      <section className="flex w-full max-w-md items-center justify-center gap-5 sm:gap-12">
        <div className="flex flex-col items-center gap-2">
          <CharacterPreview id="hijo-fiesta" scale={3} glow="#5cffc8" />
          <p className="font-press text-[7px] tracking-widest text-[var(--neon-cyan)] sm:text-[9px]">
            EL WEY DE
            <br />
            LAS FIESTAS
          </p>
        </div>
        <div className="font-press flex flex-col items-center">
          <span
            className="text-lg text-white/40 sm:text-2xl"
            style={{ letterSpacing: "0.2em" }}
          >
            VS
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <CharacterPreview id="clavel" scale={3} glow="#ff5c8a" />
          <p className="font-press text-[7px] tracking-widest text-[var(--neon-pink)] sm:text-[9px]">
            EL CLAVEL
          </p>
        </div>
      </section>

      <HomeActions />
    </main>
  );
}
