import GameClient from "@/components/GameClient";
import LandscapeGate from "@/components/LandscapeGate";

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
    <LandscapeGate>
      <main className="arena-stage safe-pt safe-pb">
        <GameClient
          code={code}
          isHost={searchParams.host === "1"}
          mode={mode}
          botDifficulty={botDifficulty}
        />
      </main>
    </LandscapeGate>
  );
}
