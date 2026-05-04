import type { Metadata } from "next";
import Link from "next/link";
import ProfilePanel from "@/components/ProfilePanel";

export const metadata: Metadata = {
  title: "Perfil — NauLPong",
};

export default function ProfilePage() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center gap-8 px-6 py-10 sm:gap-10 sm:py-14">
      <header className="flex w-full flex-col items-center gap-2 text-center">
        <p className="font-press text-[10px] uppercase tracking-[0.4em] text-white/40 sm:text-[11px]">
          Stats personales
        </p>
        <h1 className="title-glow text-4xl leading-none sm:text-5xl">
          Perfil
        </h1>
      </header>

      <ProfilePanel />

      <Link
        href="/"
        className="font-press text-[10px] tracking-widest text-white/50 hover:text-white"
      >
        ← VOLVER
      </Link>
    </main>
  );
}
