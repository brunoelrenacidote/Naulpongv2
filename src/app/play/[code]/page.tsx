import GameClient from "@/components/GameClient";

export default function PlayPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { host?: string; mode?: string; bot?: string; diff?: string };
}) {
  const code = (params.code || "").toUpperCase().slice(0, 8);
  const isBot = searchParams.bot === "1" || searchParams.mode === "bot";
  const mode: "quick" | "private" | "bot" = isBot
    ? "bot"
    : searchParams.mode === "quick"
      ? "quick"
      : "private";
  const diff = searchParams.diff;
  const botDifficulty: "easy" | "medium" | "hard" =
    diff === "easy" || diff === "hard" ? diff : "medium";
  return (
    <main className="safe-pt safe-pb relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-start px-2 py-2 sm:px-4 sm:py-4">
      <GameClient
        code={code}
        isHost={searchParams.host === "1"}
        mode={mode}
        botDifficulty={botDifficulty}
      />
    </main>
  );
}
