import type { Metadata } from "next";
import LuckRoyaleScreen from "@/components/LuckRoyaleScreen";
import RotateLockOverlay from "@/components/lobby/RotateLockOverlay";

export const metadata: Metadata = {
  title: "Luck Royale — NauLPong",
  description:
    "Gastá tus boletos para desbloquear a Morro Maincraftiano y skins exclusivas. Solo para operadores con cuenta en la nube.",
};

export default function LuckRoyalePage() {
  return (
    <>
      <RotateLockOverlay />
      <LuckRoyaleScreen />
    </>
  );
}
