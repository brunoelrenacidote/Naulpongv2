import Link from "next/link";
import HomeActions from "@/components/HomeActions";

export default function Home() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-start gap-10 px-6 py-12 text-center">
      <div className="scan-jump" aria-hidden />

      <header className="mt-4 flex flex-col items-center gap-3">
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

      <section className="font-press flex flex-col items-center gap-2 text-[10px] tracking-widest text-white/70 sm:text-xs">
        <p className="glow-cyan">EL CLAVEL</p>
        <p className="text-white/50">vs.</p>
        <p className="glow-pink">EL QUE VA POR SU HIJO A LA FIESTA</p>
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
