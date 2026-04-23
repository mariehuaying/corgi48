import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { playMergeChime } from "@/lib/audio";

const GRID_SIZE = 4;

type Direction = "up" | "down" | "left" | "right";

export interface GameTile {
  id: number;
  value: number;
  row: number;
  col: number;
  merged?: boolean;
  isNew?: boolean;
}

interface GameState {
  tiles: GameTile[];
  score: number;
  gameOver: boolean;
  won: boolean;
  keepPlaying: boolean;
}

type Action =
  | { type: "move"; direction: Direction }
  | { type: "newGame" }
  | { type: "keepPlaying" };

let tileIdCounter = 0;

function nextId() {
  tileIdCounter += 1;
  return tileIdCounter;
}

function createTile(value: number, row: number, col: number, isNew = false): GameTile {
  return {
    id: nextId(),
    value,
    row,
    col,
    merged: false,
    isNew,
  };
}

function updateTile(
  tile: GameTile,
  updates: Partial<Pick<GameTile, "value" | "row" | "col" | "merged" | "isNew">>
): GameTile {
  const nextValue = updates.value ?? tile.value;
  const nextRow = updates.row ?? tile.row;
  const nextCol = updates.col ?? tile.col;
  const nextMerged = updates.merged ?? false;
  const nextIsNew = updates.isNew ?? false;

  if (
    tile.value === nextValue &&
    tile.row === nextRow &&
    tile.col === nextCol &&
    (tile.merged ?? false) === nextMerged &&
    (tile.isNew ?? false) === nextIsNew
  ) {
    return tile;
  }

  return {
    ...tile,
    value: nextValue,
    row: nextRow,
    col: nextCol,
    merged: nextMerged,
    isNew: nextIsNew,
  };
}

function getBoard(tiles: GameTile[]) {
  const board = Array.from({ length: GRID_SIZE }, () =>
    Array<GameTile | null>(GRID_SIZE).fill(null)
  );

  for (const tile of tiles) {
    board[tile.row][tile.col] = tile;
  }

  return board;
}

function getEmptyCells(tiles: GameTile[]) {
  const occupied = new Set(tiles.map((tile) => `${tile.row}-${tile.col}`));
  const cells: [number, number][] = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (!occupied.has(`${row}-${col}`)) {
        cells.push([row, col]);
      }
    }
  }

  return cells;
}

function spawnRandomTile(tiles: GameTile[], isNew = true) {
  const emptyCells = getEmptyCells(tiles);
  if (emptyCells.length === 0) {
    return tiles;
  }

  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;

  return [...tiles, createTile(value, row, col, isNew)];
}

function createInitialState(resetIds = false): GameState {
  if (resetIds) {
    tileIdCounter = 0;
  }

  let tiles: GameTile[] = [];
  tiles = spawnRandomTile(tiles, false);
  tiles = spawnRandomTile(tiles, false);

  return {
    tiles,
    score: 0,
    gameOver: false,
    won: false,
    keepPlaying: false,
  };
}

function getLineCoordinates(direction: Direction, index: number) {
  switch (direction) {
    case "left":
      return Array.from({ length: GRID_SIZE }, (_, col) => ({ row: index, col }));
    case "right":
      return Array.from({ length: GRID_SIZE }, (_, offset) => ({
        row: index,
        col: GRID_SIZE - 1 - offset,
      }));
    case "up":
      return Array.from({ length: GRID_SIZE }, (_, row) => ({ row, col: index }));
    case "down":
      return Array.from({ length: GRID_SIZE }, (_, offset) => ({
        row: GRID_SIZE - 1 - offset,
        col: index,
      }));
  }
}

function moveTiles(tiles: GameTile[], direction: Direction) {
  const board = getBoard(tiles);
  const nextTiles: GameTile[] = [];
  let moved = false;
  let scoreGain = 0;

  for (let lineIndex = 0; lineIndex < GRID_SIZE; lineIndex += 1) {
    const coordinates = getLineCoordinates(direction, lineIndex);
    const lineTiles = coordinates
      .map(({ row, col }) => board[row][col])
      .filter((tile): tile is GameTile => tile !== null);

    let targetIndex = 0;

    for (let i = 0; i < lineTiles.length; i += 1) {
      const tile = lineTiles[i];
      const target = coordinates[targetIndex];
      const nextTile = lineTiles[i + 1];

      if (nextTile && nextTile.value === tile.value) {
        nextTiles.push(
          updateTile(tile, {
            row: target.row,
            col: target.col,
            value: tile.value * 2,
            merged: true,
            isNew: false,
          })
        );
        scoreGain += tile.value * 2;
        moved = true;
        i += 1;
      } else {
        nextTiles.push(
          updateTile(tile, {
            row: target.row,
            col: target.col,
            merged: false,
            isNew: false,
          })
        );

        if (tile.row !== target.row || tile.col !== target.col) {
          moved = true;
        }
      }

      targetIndex += 1;
    }
  }

  if (!moved) {
    return { tiles, moved: false, scoreGain: 0 };
  }

  return { tiles: nextTiles, moved: true, scoreGain };
}

function canMove(tiles: GameTile[]) {
  if (tiles.length < GRID_SIZE * GRID_SIZE) {
    return true;
  }

  const board = getBoard(tiles);

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const tile = board[row][col];
      if (!tile) {
        return true;
      }

      if (col + 1 < GRID_SIZE && board[row][col + 1]?.value === tile.value) {
        return true;
      }

      if (row + 1 < GRID_SIZE && board[row + 1][col]?.value === tile.value) {
        return true;
      }
    }
  }

  return false;
}

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "newGame":
      return createInitialState(true);
    case "keepPlaying":
      return { ...state, won: false, keepPlaying: true };
    case "move": {
      if (state.gameOver || (state.won && !state.keepPlaying)) {
        return state;
      }

      const result = moveTiles(state.tiles, action.direction);
      if (!result.moved) {
        return state;
      }

      const tiles = spawnRandomTile(result.tiles, true);
      const score = state.score + result.scoreGain;
      const hasWon = !state.keepPlaying && tiles.some((t) => t.value >= 2048);

      return {
        tiles,
        score,
        gameOver: !canMove(tiles),
        won: hasWon,
        keepPlaying: state.keepPlaying,
      };
    }
    default:
      return state;
  }
}

export function useGame() {
  const [game, dispatch] = useReducer(gameReducer, undefined, () => createInitialState(true));
  const [bestScore, setBestScore] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }

    return Number.parseInt(localStorage.getItem("corgi48-best") || "0", 10);
  });

  useEffect(() => {
    if (game.score > bestScore) {
      setBestScore(game.score);
    }
  }, [bestScore, game.score]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("corgi48-best", String(bestScore));
    }
  }, [bestScore]);

  const handleMove = useCallback((direction: Direction) => {
    dispatch({ type: "move", direction });
  }, []);

  const newGame = useCallback(() => {
    dispatch({ type: "newGame" });
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const directionMap: Partial<Record<string, Direction>> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };

      const direction = directionMap[event.key];
      if (!direction) {
        return;
      }

      event.preventDefault();
      const t0 = performance.now();
      dispatch({ type: "move", direction });
      const t1 = performance.now();
      console.log(`[perf] dispatch: ${(t1 - t0).toFixed(2)}ms`);
      requestAnimationFrame(() => {
        const t2 = performance.now();
        console.log(`[perf] to rAF: ${(t2 - t0).toFixed(2)}ms`);
        requestAnimationFrame(() => {
          const t3 = performance.now();
          console.log(`[perf] to paint: ${(t3 - t0).toFixed(2)}ms`);
        });
      });
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const keepPlaying = useCallback(() => {
    dispatch({ type: "keepPlaying" });
  }, []);

  return {
    tiles: game.tiles,
    score: game.score,
    bestScore,
    gameOver: game.gameOver,
    won: game.won,
    newGame,
    handleMove,
    keepPlaying,
  };
}
