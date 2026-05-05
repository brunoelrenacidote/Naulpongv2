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

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
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
