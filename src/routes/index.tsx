import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useGame } from "../hooks/use-game";
import { GameBoard } from "../components/GameBoard";
import { LeaderboardDialog, SubmitScoreDialog } from "../components/Leaderboard";

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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submittedScore, setSubmittedScore] = useState(0);
  const submittedForGameRef = useRef(false);

  // Open submit dialog when game ends (once per game)
  useEffect(() => {
    if (gameOver && !submittedForGameRef.current && score > 0) {
      submittedForGameRef.current = true;
      setSubmittedScore(score);
      setShowSubmit(true);
    }
  }, [gameOver, score]);

  // Reset the once-per-game flag when a new game starts
  useEffect(() => {
    if (!gameOver) {
      submittedForGameRef.current = false;
    }
  }, [gameOver]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Corgi48
        </h1>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
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
        <button
          onClick={() => setShowLeaderboard(true)}
          className="rounded-lg bg-secondary text-foreground px-4 py-2 font-bold text-sm hover:opacity-90 transition-opacity"
        >
          🏆 Leaderboard
        </button>
      </div>

      <GameBoard tiles={tiles} gameOver={gameOver} won={won} onMove={handleMove} onNewGame={newGame} onKeepPlaying={keepPlaying} />

      <LeaderboardDialog open={showLeaderboard} onOpenChange={setShowLeaderboard} />
      <SubmitScoreDialog
        open={showSubmit}
        onOpenChange={setShowSubmit}
        score={submittedScore}
        onSubmitted={() => setShowLeaderboard(true)}
      />
    </div>
  );
}
