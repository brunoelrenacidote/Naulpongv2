import type { Metadata } from "next";
import AuthButton from "@/components/AuthButton";
import ProfilePanel from "@/components/ProfilePanel";

export const metadata: Metadata = {
  title: "Perfil — NauLPong",
};

export default function ProfilePage() {
  return (
    <main className="has-bottom-nav safe-pt relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col items-center gap-6 px-4 pt-6 sm:gap-10 sm:px-6 sm:pt-10">
      <header className="flex w-full flex-col items-center gap-1 text-center sm:gap-2">
        <h1 className="hero-logo shine text-4xl leading-none sm:text-5xl">
          PERFIL
        </h1>
      </header>

      <ProfilePanel />

      <section className="flex w-full max-w-md flex-col items-center gap-3">
        <AuthButton />
      </section>
    </main>
  );
}
