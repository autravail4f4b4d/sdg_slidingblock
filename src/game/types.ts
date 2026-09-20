export type Direction = "up" | "down" | "left" | "right";

export type TierId = "tuklas" | "unawa" | "kilos";

export type PuzzlePiece = {
  id: string;
  sdg?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  target?: boolean;
};

export type Move = { pieceId: string; direction: Direction; distance: number };

export type PuzzleLevel = {
  id: TierId;
  /** A stable, pre-generated production-pool identity (for example, T1). */
  variantId?: string;
  name: string;
  description: string;
  boardWidth: 6;
  /** Production boards are 6 rows; development-only KILOS search may use 7. */
  boardHeight: 6 | 7;
  exitColumns: [2, 3];
  pieces: PuzzlePiece[];
  minimumMoves?: number;
  solution?: Move[];
};

export type GameStatus = "menu" | "instructions" | "playing" | "won";

export type GameState = {
  levelId: PuzzleLevel["id"];
  /** Kept with the active state so restart, hints, and scores stay variant-bound. */
  variantId?: string;
  status: GameStatus;
  pieces: PuzzlePiece[];
  moves: number;
  elapsedMs: number;
  history: PuzzlePiece[][];
  startedAt: number | null;
  hint: Move | null;
};
