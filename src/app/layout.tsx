import type { Metadata, Viewport } from "next";
import {
  Inter,
  Lilita_One,
  Press_Start_2P,
  VT323,
} from "next/font/google";
import "./globals.css";
import "./lobby.css";
import "./arena.css";
import "./entry.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import BottomNav from "@/components/BottomNav";
import MusicToggle from "@/components/MusicToggle";

// Display font del lobby (chunky, bubbly) y body font moderno. Las del juego
// (Press Start 2P / VT323) se conservan para que la pantalla de juego
// mantenga su estética 8-bit.
const lilita = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  weight: ["400", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const press = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press",
  display: "swap",
});

const vt = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NauLPong — Pong 1v1 con Poderes",
  description:
    "Pong online 1v1 con power-ups locos. Jugá contra El Clavel o El wey que va por su hijo a las fiestas.",
  applicationName: "NauLPong",
  appleWebApp: {
    capable: true,
    title: "NauLPong",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a14",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${lilita.variable} ${inter.variable} ${press.variable} ${vt.variable} app-body min-h-screen`}
      >
        {children}
        <BottomNav />
        <MusicToggle />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
