import type { Direction, PuzzleLevel, PuzzlePiece } from "./types";

export const clonePieces = (pieces: PuzzlePiece[]) => pieces.map((piece) => ({ ...piece }));

export function getOccupiedCells(piece: PuzzlePiece): string[] {
  const cells: string[] = [];
  for (let y = piece.y; y < piece.y + piece.height; y += 1) {
    for (let x = piece.x; x < piece.x + piece.width; x += 1) cells.push(`${x},${y}`);
  }
  return cells;
}

export function isInsideBoard(piece: PuzzlePiece, level: PuzzleLevel): boolean {
  return piece.x >= 0 && piece.y >= 0 && piece.x + piece.width <= level.boardWidth && piece.y + piece.height <= level.boardHeight;
}

export function hasOverlaps(pieces: PuzzlePiece[]): boolean {
  const occupied = new Set<string>();
  for (const piece of pieces) for (const cell of getOccupiedCells(piece)) {
    if (occupied.has(cell)) return true;
    occupied.add(cell);
  }
  return false;
}

function delta(direction: Direction): [number, number] {
  return direction === "left" ? [-1, 0] : direction === "right" ? [1, 0] : direction === "up" ? [0, -1] : [0, 1];
}

export function getMaxTravel(pieceId: string, direction: Direction, pieces: PuzzlePiece[], level: PuzzleLevel): number {
  const piece = pieces.find((candidate) => candidate.id === pieceId);
  if (!piece) return 0;
  // Every piece may slide in any cardinal direction; footprint clearance is the
  // only ordinary movement constraint.
  const others = pieces.filter((candidate) => candidate.id !== pieceId);
  const occupied = new Set(others.flatMap(getOccupiedCells));
  const [dx, dy] = delta(direction);
  let distance = 0;
  while (true) {
    const candidate = { ...piece, x: piece.x + dx * (distance + 1), y: piece.y + dy * (distance + 1) };
    if (!isInsideBoard(candidate, level) || getOccupiedCells(candidate).some((cell) => occupied.has(cell))) return distance;
    distance += 1;
  }
}

export function canMove(pieceId: string, direction: Direction, pieces: PuzzlePiece[], level: PuzzleLevel): boolean {
  return getMaxTravel(pieceId, direction, pieces, level) > 0;
}

export function applyMove(pieceId: string, direction: Direction, distance: number, pieces: PuzzlePiece[], level: PuzzleLevel): PuzzlePiece[] {
  const maximum = getMaxTravel(pieceId, direction, pieces, level);
  if (!Number.isInteger(distance) || distance < 1 || distance > maximum) return clonePieces(pieces);
  const [dx, dy] = delta(direction);
  return pieces.map((piece) => piece.id === pieceId ? { ...piece, x: piece.x + dx * distance, y: piece.y + dy * distance } : { ...piece });
}

export function targetCanExit(pieces: PuzzlePiece[], level: PuzzleLevel): boolean {
  const target = pieces.find((piece) => piece.target);
  return Boolean(target && target.x === level.exitColumns[0] && target.y === level.boardHeight - target.height && target.width === 2 && target.height === 2);
}
