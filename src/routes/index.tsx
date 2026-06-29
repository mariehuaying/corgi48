import { createFileRoute } from "@tanstack/react-router";
import { useGame } from "../hooks/use-game";
import { GameBoard } from "../components/GameBoard";


export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Corgi48" },
      { name: "description", content: "Play 2048 with adorable corgis! Merge tiles to discover new corgi photos." },
    ],
  }),
});

function Index() {
  const { tiles, score, bestScore, gameOver, won, newGame, handleMove, keepPlaying } = useGame();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Corgi48
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center rounded-lg bg-secondary px-5 py-2 min-w-[80px]">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</span>
          <span className="text-2xl font-bold text-foreground">{score}</span>
        </div>
        <div className="flex flex-col items-center rounded-lg bg-secondary px-5 py-2 min-w-[80px]">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Best</span>
          <span className="text-2xl font-bold text-foreground">{bestScore}</span>
        </div>
        <button
          onClick={newGame}
          className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-bold text-sm hover:opacity-90 transition-opacity"
        >
          New Game
        </button>
      </div>

      <GameBoard tiles={tiles} gameOver={gameOver} won={won} onMove={handleMove} onNewGame={newGame} onKeepPlaying={keepPlaying} />
    </div>
  );
}
