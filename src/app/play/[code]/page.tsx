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
      <main className="arena-stage hud-console safe-pt safe-pb">
        <span className="arena-bg-hex" aria-hidden />
        <span className="arena-bg-scan" aria-hidden />
        <span className="arena-bezel-corner tl" aria-hidden />
        <span className="arena-bezel-corner tr" aria-hidden />
        <span className="arena-bezel-corner bl" aria-hidden />
        <span className="arena-bezel-corner br" aria-hidden />
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
