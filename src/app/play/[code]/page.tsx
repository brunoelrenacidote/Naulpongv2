import GameClient from "@/components/GameClient";

export default function PlayPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { host?: string; mode?: string };
}) {
  const code = (params.code || "").toUpperCase().slice(0, 8);
  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-start px-2 py-2 sm:px-4 sm:py-4">
      <GameClient
        code={code}
        isHost={searchParams.host === "1"}
        mode={searchParams.mode === "quick" ? "quick" : "private"}
      />
    </main>
  );
}
