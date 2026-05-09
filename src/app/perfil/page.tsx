import type { Metadata } from "next";
import AuthButton from "@/components/AuthButton";
import ProfilePanel from "@/components/ProfilePanel";
import RotateLockOverlay from "@/components/lobby/RotateLockOverlay";

export const metadata: Metadata = {
  title: "Perfil — NauLPong",
};

export default function ProfilePage() {
  return (
    <>
      <RotateLockOverlay />
      <main className="console-screen">
      <div className="console-bg" aria-hidden />
      <div className="console-scan" aria-hidden />
      <span className="console-glow tl" aria-hidden />
      <span className="console-glow br" aria-hidden />
      <div className="console-bezel" aria-hidden>
        <span className="console-bezel-corner tl" />
        <span className="console-bezel-corner tr" />
        <span className="console-bezel-corner bl" />
        <span className="console-bezel-corner br" />
      </div>

      <div className="console-content">
        <header className="console-statusbar" aria-hidden>
          <span className="chip">
            <span className="dot" />
            <span>UDDERGAMES // NAULPONG</span>
          </span>
          <span className="chip cyan">
            <span>OPERATOR · DOSSIER</span>
            <span className="dot green" />
          </span>
        </header>

        <section className="console-hero">
          <span className="console-eyebrow">[ OPERATOR PROFILE ]</span>
          <h1 className="console-title" data-text="PERFIL">
            PERFIL
          </h1>
          <p className="console-subtitle">
            Tu carta de despliegue: estadísticas de combate, racha activa y
            logros desbloqueados en la arena.
          </p>
        </section>

        <ProfilePanel />

        <section
          className="console-panel accent-gold"
          style={{ animationDelay: "420ms" } as React.CSSProperties}
        >
          <span className="console-panel-tag">{"// CLOUD SYNC"}</span>
          <span className="console-panel-bracket tl" aria-hidden />
          <span className="console-panel-bracket tr" aria-hidden />
          <span className="console-panel-bracket bl" aria-hidden />
          <span className="console-panel-bracket br" aria-hidden />
          <h2 className="console-panel-title">
            <span className="glyph">☁</span>
            SESIÓN
          </h2>
          <AuthButton />
        </section>
      </div>
      </main>
    </>
  );
}
