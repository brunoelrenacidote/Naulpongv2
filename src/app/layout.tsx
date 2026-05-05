import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import MusicToggle from "@/components/MusicToggle";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import BottomNav from "@/components/BottomNav";

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
      <body className={`${press.variable} ${vt.variable} crt-screen min-h-screen`}>
        <div className="scanlines" aria-hidden />
        <div className="vignette" aria-hidden />
        <MusicToggle />
        {children}
        <BottomNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
