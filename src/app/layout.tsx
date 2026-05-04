import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a14",
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
        {children}
      </body>
    </html>
  );
}
