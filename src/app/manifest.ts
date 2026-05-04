import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NauLPong — Pong 1v1 con Poderes",
    short_name: "NauLPong",
    description:
      "Pong online 1v1 con power-ups locos. Jugá contra El Clavel o El wey que va por su hijo a las fiestas.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0a0a14",
    theme_color: "#0a0a14",
    lang: "es",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["games", "entertainment"],
  };
}
