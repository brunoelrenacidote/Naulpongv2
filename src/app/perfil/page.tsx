import type { Metadata } from "next";
import ProfilePanel from "@/components/ProfilePanel";

export const metadata: Metadata = {
  title: "Perfil — NauLPong",
};

export default function ProfilePage() {
  return (
    <main className="has-bottom-nav safe-pt relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center gap-6 px-4 pt-8 sm:gap-10 sm:px-6 sm:pt-12">
      <header className="flex w-full flex-col items-center gap-1 text-center sm:gap-2">
        <p className="font-press text-[9px] uppercase tracking-[0.4em] text-white/40 sm:text-[11px]">
          Stats personales
        </p>
        <h1 className="title-glow text-4xl leading-none sm:text-5xl">
          Perfil
        </h1>
      </header>

      <ProfilePanel />
    </main>
  );
}
