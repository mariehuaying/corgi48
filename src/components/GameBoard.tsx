import { useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { CORGI_MAP } from "@/lib/corgi-images";

interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  merged?: boolean;
  isNew?: boolean;
}

function TileView({ tile }: { tile: Tile }) {
  const src = CORGI_MAP[tile.value];
  const isGold = tile.value >= 2048;
  const animClass = tile.merged
    ? "animate-tile-merge"
    : tile.isNew
      ? "animate-tile-appear"
      : "";

  return (
    <div
      className={`absolute rounded-lg overflow-hidden ${animClass}`}
      style={{
        width: "calc(25% - 6px)",
        height: "calc(25% - 6px)",
        left: `calc(${tile.col * 25}% + 3px)`,
        top: `calc(${tile.row * 25}% + 3px)`,
        transition: "left 0.12s ease, top 0.12s ease",
      }}
    >
      {src && !isGold ? (
        <img
          src={src}
          alt={String(tile.value)}
          className="w-full h-full object-cover rounded-lg"
          draggable={false}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-2xl font-bold rounded-lg"
          style={{ backgroundColor: "var(--tile-gold)", color: "var(--foreground)" }}
        >
          🏆
        </div>
      )}
      <span
        className="absolute bottom-1 right-1 font-bold rounded-md leading-none"
        style={{
          backgroundColor: "oklch(0.15 0.02 50 / 55%)",
          color: "oklch(0.97 0.01 75)",
          fontSize: tile.value >= 1000 ? "0.55rem" : "0.65rem",
          padding: "2px 5px",
        }}
      >
        {tile.value}
      </span>
    </div>
  );
}

interface GameBoardProps {
  tiles: Tile[];
  gameOver: boolean;
  onMove: (dir: "up" | "down" | "left" | "right") => void;
  onNewGame: () => void;
}

export function GameBoard({ tiles, gameOver, onMove, onNewGame }: GameBoardProps) {
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchRef.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchRef.current.x;
      const dy = t.clientY - touchRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < 30) return;
      if (absDx > absDy) {
        onMove(dx > 0 ? "right" : "left");
      } else {
        onMove(dy > 0 ? "down" : "up");
      }
      touchRef.current = null;
    },
    [onMove]
  );

  const emptyCells: ReactNode[] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      emptyCells.push(
        <div key={`${r}-${c}`} className="rounded-lg bg-cell-bg" />
      );

  return (
    <div
      className="relative w-full max-w-[min(90vw,400px)] aspect-square rounded-xl bg-grid-bg p-1.5 select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="grid grid-cols-4 grid-rows-4 gap-1.5 w-full h-full">
        {emptyCells}
      </div>
      <div className="absolute inset-1.5">
        {tiles.map((tile) => (
          <TileView key={tile.id} tile={tile} />
        ))}
      </div>
      {gameOver && (
        <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-4"
          style={{ backgroundColor: "oklch(0.25 0.04 50 / 75%)" }}>
          <p className="text-3xl font-bold" style={{ color: "oklch(0.97 0.01 75)" }}>
            Game Over!
          </p>
          <button
            onClick={onNewGame}
            className="px-6 py-2 rounded-lg font-bold text-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
