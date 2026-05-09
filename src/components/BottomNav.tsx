"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  glyph: string;
  label: string;
  match: (path: string) => boolean;
}

const ITEMS: NavItem[] = [
  {
    href: "/perfil",
    glyph: "⚙",
    label: "PERFIL",
    match: (p) => p.startsWith("/perfil"),
  },
  {
    href: "/",
    glyph: "▶",
    label: "JUGAR",
    match: (p) => p === "/" || p.startsWith("/play"),
  },
  {
    href: "/luck-royale",
    glyph: "❖",
    label: "LUCK",
    match: (p) => p.startsWith("/luck-royale"),
  },
  {
    href: "/about",
    glyph: "?",
    label: "GUÍA",
    match: (p) => p.startsWith("/about"),
  },
];

export default function BottomNav() {
  const pathname = usePathname() ?? "/";
  // Hide on the in-game route — the game UI needs all available vertical
  // space and has its own top-bar back link.
  if (pathname.startsWith("/play")) return null;
  // Hide on the lobby (home) — the lobby has its own side-icon column with
  // the same destinations, plus a big PLAY CTA, and a second nav at the
  // bottom would crowd it.
  if (pathname === "/") return null;
  // Hide on /perfil and /about — those pages now use the same console HUD
  // aesthetic as the lobby, with their own top status bar + back link, and
  // the BottomNav rompe la estética del HUD.
  if (pathname.startsWith("/perfil")) return null;
  if (pathname.startsWith("/about")) return null;
  // El /login es una pantalla console-style con su propio status bar y
  // CTA de "volver al lobby"; el BottomNav rompe la estética del HUD.
  if (pathname.startsWith("/login")) return null;
  // El /luck-royale es console-style también; hide BottomNav.
  if (pathname.startsWith("/luck-royale")) return null;

  return (
    <nav className="bottom-nav v2" aria-label="Navegación principal">
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="glyph" aria-hidden>
              {item.glyph}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
