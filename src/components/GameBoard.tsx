import { memo, useCallback, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { CORGI_MAP } from "@/lib/corgi-images";
import type { GameTile } from "@/hooks/use-game";

const TILE_GAP = 6;
const TILE_SIZE = "calc((100% - 18px) / 4)";

const TileView = memo(
  function TileView({ tile }: { tile: GameTile }) {
    const src = CORGI_MAP[tile.value];
    const isGold = tile.value >= 2048;
    const animClass = tile.merged
      ? "animate-tile-merge"
      : tile.isNew
        ? "animate-tile-appear"
        : "";

    return (
      <div
        className="absolute top-0 left-0"
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          transform: `translate3d(calc(${tile.col * 100}% + ${tile.col * TILE_GAP}px), calc(${tile.row * 100}% + ${tile.row * TILE_GAP}px), 0)`,
          transition: "transform 80ms ease-out",
          willChange: "transform",
        }}
      >
        <div className={`relative h-full w-full overflow-hidden rounded-lg ${animClass}`}>
          {src && !isGold ? (
            <img
              src={src}
              alt={String(tile.value)}
              className="h-full w-full rounded-lg object-cover"
              draggable={false}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center rounded-lg text-2xl font-bold"
              style={{ backgroundColor: "var(--tile-gold)", color: "var(--foreground)" }}
            >
              🏆
            </div>
          )}
          <span
            className="absolute bottom-1 right-1 rounded-md font-bold leading-none"
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
      </div>
    );
  },
  (prev, next) => prev.tile === next.tile
);

interface GameBoardProps {
  tiles: GameTile[];
  gameOver: boolean;
  onMove: (dir: "up" | "down" | "left" | "right") => void;
  onNewGame: () => void;
}

export function GameBoard({ tiles, gameOver, onMove, onNewGame }: GameBoardProps) {
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!touchRef.current) {
        return;
      }

      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchRef.current.x;
      const dy = touch.clientY - touchRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < 30) {
        touchRef.current = null;
        return;
      }

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
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      emptyCells.push(<div key={`${row}-${col}`} className="rounded-lg bg-cell-bg" />);
    }
  }

  return (
    <div
      className="relative aspect-square w-full max-w-[min(90vw,400px)] touch-none select-none rounded-xl bg-grid-bg p-1.5"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="grid h-full w-full grid-cols-4 grid-rows-4 gap-1.5">
        {emptyCells}
      </div>
      <div className="pointer-events-none absolute inset-1.5">
        {tiles.map((tile) => (
          <TileView key={tile.id} tile={tile} />
        ))}
      </div>
      {gameOver && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl"
          style={{ backgroundColor: "oklch(0.25 0.04 50 / 75%)" }}
        >
          <p className="text-3xl font-bold" style={{ color: "oklch(0.97 0.01 75)" }}>
            Game Over!
          </p>
          <button
            onClick={onNewGame}
            className="rounded-lg bg-primary px-6 py-2 text-lg font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
