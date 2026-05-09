import type { Metadata } from "next";
import LoginScreen from "@/components/LoginScreen";
import RotateLockOverlay from "@/components/lobby/RotateLockOverlay";

export const metadata: Metadata = {
  title: "Acceso — NauLPong",
  description:
    "Iniciá sesión o creá una cuenta para sincronizar tus stats de NauLPong en la nube.",
};

export default function LoginPage() {
  return (
    <>
      <RotateLockOverlay />
      <LoginScreen />
    </>
  );
}
