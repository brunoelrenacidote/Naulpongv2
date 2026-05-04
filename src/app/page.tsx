import Link from "next/link";
import HomeActions from "@/components/HomeActions";
import CharacterPreview from "@/components/CharacterPreview";

export default function Home() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-start gap-8 px-6 py-10 text-center sm:gap-10 sm:py-12">
      <div className="scan-jump" aria-hidden />

      <header className="mt-2 flex flex-col items-center gap-3 sm:mt-4">
        <p className="font-press glow-yellow flicker text-xs sm:text-sm">
          ★ INSERT COIN ★
        </p>
        <h1 className="title-glow text-4xl leading-tight sm:text-6xl md:text-7xl">
          NauL
          <span className="inline-block px-2">Pong</span>
        </h1>
        <p className="font-vt text-xl text-white/80 sm:text-2xl">
          Pong 1v1 con poderes — online retro arcade
        </p>
      </header>

      <section className="font-press flex w-full max-w-md items-center justify-center gap-4 sm:gap-8">
        <div className="flex flex-col items-center gap-2">
          <CharacterPreview id="hijo-fiesta" scale={4} glow="#5cffc8" />
          <p className="glow-cyan text-[8px] sm:text-[10px]">
            EL HIJO<br />FIESTA
          </p>
        </div>
        <div className="font-press flex flex-col items-center text-yellow-300">
          <span
            className="text-2xl sm:text-3xl"
            style={{ textShadow: "0 0 12px #ffd95c" }}
          >
            VS
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <CharacterPreview id="clavel" scale={4} glow="#ff5c8a" />
          <p className="glow-pink text-[8px] sm:text-[10px]">EL CLAVEL</p>
        </div>
      </section>

      <HomeActions />

      <footer className="font-vt mt-auto pt-12 text-center text-base text-white/50">
        <p>© NauLPong — first to 7 wins</p>
        <p className="mt-1 text-sm">
          <Link href="/about" className="underline hover:text-white">
            Cómo se juega
          </Link>
        </p>
      </footer>
    </main>
  );
}
