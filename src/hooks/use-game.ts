import { useState, useCallback, useEffect, useRef } from "react";

type Grid = number[][];
type Direction = "up" | "down" | "left" | "right";

interface TileMeta {
  id: number;
  value: number;
  row: number;
  col: number;
  merged?: boolean;
  isNew?: boolean;
}

let tileIdCounter = 0;
const nextId = () => ++tileIdCounter;

function createEmptyGrid(): Grid {
  return Array.from({ length: 4 }, () => Array(4).fill(0));
}

function getEmptyCells(grid: Grid): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (grid[r][c] === 0) cells.push([r, c]);
  return cells;
}

function addRandomTile(grid: Grid): Grid {
  const empty = getEmptyCells(grid);
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map((row) => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

function rotateGrid(grid: Grid): Grid {
  const n = grid.length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => grid[n - 1 - j][i])
  );
}

function moveLeft(grid: Grid): { grid: Grid; score: number; moved: boolean; mergedPositions: Set<string> } {
  let score = 0;
  let moved = false;
  const mergedPositions = new Set<string>();
  const newGrid = grid.map((row, r) => {
    const filtered = row.filter((v) => v !== 0);
    const result: number[] = [];
    for (let i = 0; i < filtered.length; i++) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const merged = filtered[i] * 2;
        result.push(merged);
        score += merged;
        mergedPositions.add(`${r}-${result.length - 1}`);
        i++;
        moved = true;
      } else {
        result.push(filtered[i]);
      }
    }
    while (result.length < 4) result.push(0);
    if (result.some((v, i) => v !== row[i])) moved = true;
    return result;
  });
  return { grid: newGrid, score, moved, mergedPositions };
}

function move(grid: Grid, direction: Direction): { grid: Grid; score: number; moved: boolean; mergedPositions: Set<string> } {
  let rotations = 0;
  switch (direction) {
    case "left": rotations = 0; break;
    case "down": rotations = 1; break;
    case "right": rotations = 2; break;
    case "up": rotations = 3; break;
  }

  let g = grid;
  for (let i = 0; i < rotations; i++) g = rotateGrid(g);

  const result = moveLeft(g);

  let rg = result.grid;
  for (let i = 0; i < (4 - rotations) % 4; i++) rg = rotateGrid(rg);

  return { ...result, grid: rg };
}

function canMove(grid: Grid): boolean {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) return true;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
    }
  return false;
}

function gridToTiles(grid: Grid, mergedPositions: Set<string>, newTilePos: [number, number] | null): TileMeta[] {
  const tiles: TileMeta[] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (grid[r][c] !== 0)
        tiles.push({
          id: nextId(),
          value: grid[r][c],
          row: r,
          col: c,
          merged: mergedPositions.has(`${r}-${c}`),
          isNew: newTilePos !== null && newTilePos[0] === r && newTilePos[1] === c,
        });
  return tiles;
}

export function useGame() {
  const [grid, setGrid] = useState<Grid>(() => {
    let g = createEmptyGrid();
    g = addRandomTile(g);
    g = addRandomTile(g);
    return g;
  });
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("corgi48-best") || "0", 10);
    }
    return 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [tiles, setTiles] = useState<TileMeta[]>(() => gridToTiles(grid, new Set(), null));

  const handleMove = useCallback(
    (direction: Direction) => {
      if (gameOver) return;
      const result = move(grid, direction);
      if (!result.moved) return;

      const newGrid = addRandomTile(result.grid);
      const newScore = score + result.score;

      // Find the new tile position
      let newTilePos: [number, number] | null = null;
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
          if (result.grid[r][c] === 0 && newGrid[r][c] !== 0)
            newTilePos = [r, c];

      setGrid(newGrid);
      setScore(newScore);
      setTiles(gridToTiles(newGrid, result.mergedPositions, newTilePos));

      if (newScore > bestScore) {
        setBestScore(newScore);
        if (typeof window !== "undefined")
          localStorage.setItem("corgi48-best", String(newScore));
      }

      if (!canMove(newGrid)) setGameOver(true);
    },
    [grid, score, bestScore, gameOver]
  );

  const newGame = useCallback(() => {
    tileIdCounter = 0;
    let g = createEmptyGrid();
    g = addRandomTile(g);
    g = addRandomTile(g);
    setGrid(g);
    setScore(0);
    setGameOver(false);
    setTiles(gridToTiles(g, new Set(), null));
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      };
      if (map[e.key]) {
        e.preventDefault();
        handleMove(map[e.key]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleMove]);

  return { tiles, score, bestScore, gameOver, newGame, handleMove };
}
