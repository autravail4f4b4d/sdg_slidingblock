import type { Move, PuzzleLevel } from "../game/types";

export type UatCandidate = PuzzleLevel & {
  candidateId: string;
  exactMinimum: number;
  minimumMoves: number;
  solution: Move[];
  qualityApproved: true;
  manualUatApproved: false;
};

export type UatAlternate = {
  candidateId: string;
  exactMinimum: number;
  scrambleSeed: number;
  scrambleSteps: number;
};

/**
 * Development-only dense seed for offline candidate generation. It begins at
 * the exit so any legal reverse walk from it is reachable by construction.
 * It is intentionally excluded from production pools and carries no approval
 * or claimed minimum.
 */
export const denseCandidateOrigin: PuzzleLevel = {
  id: "tuklas",
  name: "Dense candidate seed",
  description: "development only",
  boardWidth: 6,
  boardHeight: 6,
  exitColumns: [2, 3],
  pieces: [
    { id: "sdg-1", sdg: 1, x: 1, y: 1, width: 1, height: 2 },
    { id: "sdg-2", sdg: 2, x: 4, y: 1, width: 1, height: 2 },
    { id: "sdg-3", sdg: 3, x: 1, y: 3, width: 1, height: 2 },
    { id: "sdg-4", sdg: 4, x: 4, y: 3, width: 1, height: 2 },
    { id: "sdg-5", sdg: 5, x: 2, y: 1, width: 2, height: 1 },
    { id: "sdg-6", sdg: 6, x: 0, y: 0, width: 1, height: 2 },
    { id: "sdg-7", sdg: 7, x: 5, y: 0, width: 1, height: 2 },
    { id: "sdg-8", sdg: 8, x: 1, y: 0, width: 2, height: 1 },
    { id: "sdg-9", sdg: 9, x: 3, y: 0, width: 2, height: 1 },
    { id: "sdg-10", sdg: 10, x: 0, y: 2, width: 1, height: 2 },
    { id: "sdg-11", sdg: 11, x: 0, y: 4, width: 1, height: 2 },
    { id: "sdg-12", sdg: 12, x: 5, y: 2, width: 1, height: 2 },
    { id: "sdg-13", sdg: 13, x: 5, y: 4, width: 1, height: 2 },
    { id: "sdg-14", sdg: 14, x: 2, y: 2, width: 1, height: 1 },
    { id: "sdg-15", sdg: 15, x: 3, y: 2, width: 1, height: 1 },
    { id: "sdg-16", sdg: 16, x: 1, y: 5, width: 1, height: 1 },
    { id: "sdg-17", sdg: 17, x: 4, y: 5, width: 1, height: 1 },
    { id: "sdg-master", x: 2, y: 4, width: 2, height: 2, target: true },
  ],
};

/** Development-only 6 by 7, two-hole KILOS seed. It is never promoted. */
export const kilosSevenRowOrigin: PuzzleLevel = {
  id: "kilos",
  name: "KILOS: six-by-seven seed",
  description: "development only",
  boardWidth: 6,
  boardHeight: 7,
  exitColumns: [2, 3],
  pieces: [
    { id: "sdg-1", sdg: 1, x: 0, y: 0, width: 4, height: 1 },
    { id: "sdg-2", sdg: 2, x: 0, y: 1, width: 4, height: 1 },
    { id: "sdg-3", sdg: 3, x: 0, y: 2, width: 3, height: 1 },
    { id: "sdg-4", sdg: 4, x: 3, y: 2, width: 3, height: 1 },
    { id: "sdg-5", sdg: 5, x: 0, y: 3, width: 3, height: 1 },
    { id: "sdg-6", sdg: 6, x: 3, y: 3, width: 3, height: 1 },
    { id: "sdg-7", sdg: 7, x: 4, y: 0, width: 2, height: 1 },
    { id: "sdg-8", sdg: 8, x: 4, y: 1, width: 2, height: 1 },
    { id: "sdg-9", sdg: 9, x: 0, y: 4, width: 1, height: 2 },
    { id: "sdg-10", sdg: 10, x: 1, y: 4, width: 1, height: 2 },
    { id: "sdg-11", sdg: 11, x: 4, y: 4, width: 1, height: 2 },
    { id: "sdg-12", sdg: 12, x: 5, y: 4, width: 1, height: 1 },
    { id: "sdg-13", sdg: 13, x: 5, y: 5, width: 1, height: 1 },
    { id: "sdg-14", sdg: 14, x: 0, y: 6, width: 1, height: 1 },
    { id: "sdg-15", sdg: 15, x: 1, y: 6, width: 1, height: 1 },
    { id: "sdg-16", sdg: 16, x: 4, y: 6, width: 1, height: 1 },
    { id: "sdg-17", sdg: 17, x: 5, y: 6, width: 1, height: 1 },
    { id: "sdg-master", x: 2, y: 5, width: 2, height: 2, target: true },
  ],
};

/**
 * Solver-proven, non-production candidates selected for the next manual UAT.
 * They are deliberately outside productionPools and cannot be release variants
 * until a human records approval after playtesting.
 */
export const uatCandidates = {
  tuklas: {
    candidateId: "tuklas-df007c26-66",
    id: "tuklas",
    name: "TUKLAS",
    description: "manual UAT candidate",
    boardWidth: 6,
    boardHeight: 6,
    exitColumns: [2, 3],
    exactMinimum: 10,
    minimumMoves: 10,
    qualityApproved: true,
    manualUatApproved: false,
    pieces: [
      { id: "sdg-1", sdg: 1, x: 1, y: 2, width: 1, height: 2 }, { id: "sdg-2", sdg: 2, x: 4, y: 2, width: 1, height: 2 },
      { id: "sdg-3", sdg: 3, x: 1, y: 4, width: 1, height: 2 }, { id: "sdg-4", sdg: 4, x: 4, y: 4, width: 1, height: 2 },
      { id: "sdg-5", sdg: 5, x: 3, y: 1, width: 2, height: 1 }, { id: "sdg-6", sdg: 6, x: 0, y: 0, width: 1, height: 2 },
      { id: "sdg-7", sdg: 7, x: 5, y: 0, width: 1, height: 2 }, { id: "sdg-8", sdg: 8, x: 1, y: 0, width: 2, height: 1 },
      { id: "sdg-9", sdg: 9, x: 3, y: 0, width: 2, height: 1 }, { id: "sdg-10", sdg: 10, x: 0, y: 2, width: 1, height: 2 },
      { id: "sdg-11", sdg: 11, x: 0, y: 4, width: 1, height: 2 }, { id: "sdg-12", sdg: 12, x: 5, y: 2, width: 1, height: 2 },
      { id: "sdg-13", sdg: 13, x: 5, y: 4, width: 1, height: 2 }, { id: "sdg-14", sdg: 14, x: 2, y: 1, width: 1, height: 1 },
      { id: "sdg-15", sdg: 15, x: 2, y: 2, width: 1, height: 1 }, { id: "sdg-16", sdg: 16, x: 2, y: 5, width: 1, height: 1 },
      { id: "sdg-17", sdg: 17, x: 3, y: 5, width: 1, height: 1 }, { id: "sdg-master", x: 2, y: 3, width: 2, height: 2, target: true },
    ],
    solution: [
      { pieceId: "sdg-1", direction: "up", distance: 1 }, { pieceId: "sdg-3", direction: "up", distance: 1 },
      { pieceId: "sdg-15", direction: "right", distance: 1 }, { pieceId: "sdg-14", direction: "down", distance: 1 },
      { pieceId: "sdg-5", direction: "left", distance: 1 }, { pieceId: "sdg-2", direction: "up", distance: 1 },
      { pieceId: "sdg-4", direction: "up", distance: 1 }, { pieceId: "sdg-16", direction: "left", distance: 1 },
      { pieceId: "sdg-17", direction: "right", distance: 1 }, { pieceId: "sdg-master", direction: "down", distance: 1 },
    ],
  } satisfies UatCandidate,
  unawa: {
    candidateId: "unawa-90a18d5c-151",
    id: "unawa",
    name: "UNAWA",
    description: "manual UAT candidate",
    boardWidth: 6,
    boardHeight: 6,
    exitColumns: [2, 3],
    exactMinimum: 21,
    minimumMoves: 21,
    qualityApproved: true,
    manualUatApproved: false,
    pieces: [
      { id: "sdg-1", sdg: 1, x: 1, y: 2, width: 1, height: 2 }, { id: "sdg-2", sdg: 2, x: 4, y: 2, width: 1, height: 2 },
      { id: "sdg-3", sdg: 3, x: 2, y: 4, width: 1, height: 2 }, { id: "sdg-4", sdg: 4, x: 4, y: 4, width: 1, height: 2 },
      { id: "sdg-5", sdg: 5, x: 0, y: 0, width: 2, height: 1 }, { id: "sdg-6", sdg: 6, x: 0, y: 1, width: 1, height: 2 },
      { id: "sdg-7", sdg: 7, x: 5, y: 0, width: 1, height: 2 }, { id: "sdg-8", sdg: 8, x: 2, y: 0, width: 2, height: 1 },
      { id: "sdg-9", sdg: 9, x: 3, y: 1, width: 2, height: 1 }, { id: "sdg-10", sdg: 10, x: 0, y: 3, width: 1, height: 2 },
      { id: "sdg-11", sdg: 11, x: 1, y: 4, width: 1, height: 2 }, { id: "sdg-12", sdg: 12, x: 5, y: 2, width: 1, height: 2 },
      { id: "sdg-13", sdg: 13, x: 5, y: 4, width: 1, height: 2 }, { id: "sdg-14", sdg: 14, x: 1, y: 1, width: 1, height: 1 },
      { id: "sdg-15", sdg: 15, x: 2, y: 1, width: 1, height: 1 }, { id: "sdg-16", sdg: 16, x: 3, y: 4, width: 1, height: 1 },
      { id: "sdg-17", sdg: 17, x: 3, y: 5, width: 1, height: 1 }, { id: "sdg-master", x: 2, y: 2, width: 2, height: 2, target: true },
    ],
    solution: [
      { pieceId: "sdg-8", direction: "right", distance: 1 }, { pieceId: "sdg-5", direction: "right", distance: 1 },
      { pieceId: "sdg-6", direction: "up", distance: 1 }, { pieceId: "sdg-10", direction: "up", distance: 1 },
      { pieceId: "sdg-11", direction: "left", distance: 1 }, { pieceId: "sdg-3", direction: "left", distance: 1 },
      { pieceId: "sdg-16", direction: "left", distance: 1 }, { pieceId: "sdg-16", direction: "down", distance: 1 },
      { pieceId: "sdg-master", direction: "down", distance: 1 }, { pieceId: "sdg-15", direction: "down", distance: 1 },
      { pieceId: "sdg-14", direction: "right", distance: 1 }, { pieceId: "sdg-1", direction: "up", distance: 1 },
      { pieceId: "sdg-3", direction: "up", distance: 1 }, { pieceId: "sdg-15", direction: "right", distance: 1 },
      { pieceId: "sdg-14", direction: "down", distance: 1 }, { pieceId: "sdg-9", direction: "left", distance: 1 },
      { pieceId: "sdg-2", direction: "up", distance: 1 }, { pieceId: "sdg-4", direction: "up", distance: 1 },
      { pieceId: "sdg-16", direction: "left", distance: 1 }, { pieceId: "sdg-17", direction: "right", distance: 1 },
      { pieceId: "sdg-master", direction: "down", distance: 1 },
    ],
  } satisfies UatCandidate,
  kilos: {
    candidateId: "kilos-811429d4-451",
    id: "kilos",
    name: "KILOS",
    description: "manual UAT candidate",
    boardWidth: 6,
    boardHeight: 6,
    exitColumns: [2, 3],
    exactMinimum: 28,
    minimumMoves: 28,
    qualityApproved: true,
    manualUatApproved: false,
    pieces: [
      { id: "sdg-1", sdg: 1, x: 1, y: 1, width: 1, height: 2 }, { id: "sdg-2", sdg: 2, x: 4, y: 2, width: 1, height: 2 },
      { id: "sdg-3", sdg: 3, x: 1, y: 3, width: 1, height: 2 }, { id: "sdg-4", sdg: 4, x: 3, y: 4, width: 1, height: 2 },
      { id: "sdg-5", sdg: 5, x: 4, y: 1, width: 2, height: 1 }, { id: "sdg-6", sdg: 6, x: 0, y: 0, width: 1, height: 2 },
      { id: "sdg-7", sdg: 7, x: 5, y: 2, width: 1, height: 2 }, { id: "sdg-8", sdg: 8, x: 2, y: 0, width: 2, height: 1 },
      { id: "sdg-9", sdg: 9, x: 4, y: 0, width: 2, height: 1 }, { id: "sdg-10", sdg: 10, x: 0, y: 2, width: 1, height: 2 },
      { id: "sdg-11", sdg: 11, x: 0, y: 4, width: 1, height: 2 }, { id: "sdg-12", sdg: 12, x: 5, y: 4, width: 1, height: 2 },
      { id: "sdg-13", sdg: 13, x: 4, y: 4, width: 1, height: 2 }, { id: "sdg-14", sdg: 14, x: 2, y: 1, width: 1, height: 1 },
      { id: "sdg-15", sdg: 15, x: 3, y: 1, width: 1, height: 1 }, { id: "sdg-16", sdg: 16, x: 1, y: 5, width: 1, height: 1 },
      { id: "sdg-17", sdg: 17, x: 2, y: 5, width: 1, height: 1 }, { id: "sdg-master", x: 2, y: 2, width: 2, height: 2, target: true },
    ],
    solution: [
      { pieceId: "sdg-8", direction: "left", distance: 1 }, { pieceId: "sdg-9", direction: "left", distance: 1 },
      { pieceId: "sdg-17", direction: "up", distance: 1 }, { pieceId: "sdg-16", direction: "right", distance: 1 },
      { pieceId: "sdg-3", direction: "down", distance: 1 }, { pieceId: "sdg-1", direction: "down", distance: 1 },
      { pieceId: "sdg-14", direction: "left", distance: 1 }, { pieceId: "sdg-15", direction: "left", distance: 1 },
      { pieceId: "sdg-5", direction: "left", distance: 1 }, { pieceId: "sdg-7", direction: "up", distance: 2 },
      { pieceId: "sdg-2", direction: "right", distance: 1 }, { pieceId: "sdg-13", direction: "up", distance: 2 },
      { pieceId: "sdg-4", direction: "right", distance: 1 }, { pieceId: "sdg-16", direction: "right", distance: 1 },
      { pieceId: "sdg-17", direction: "down", distance: 1 }, { pieceId: "sdg-master", direction: "down", distance: 1 },
      { pieceId: "sdg-15", direction: "down", distance: 1 }, { pieceId: "sdg-14", direction: "right", distance: 1 },
      { pieceId: "sdg-1", direction: "up", distance: 1 }, { pieceId: "sdg-3", direction: "up", distance: 1 },
      { pieceId: "sdg-15", direction: "right", distance: 1 }, { pieceId: "sdg-14", direction: "down", distance: 1 },
      { pieceId: "sdg-5", direction: "left", distance: 1 }, { pieceId: "sdg-13", direction: "up", distance: 1 },
      { pieceId: "sdg-4", direction: "up", distance: 1 }, { pieceId: "sdg-16", direction: "right", distance: 1 },
      { pieceId: "sdg-17", direction: "left", distance: 1 }, { pieceId: "sdg-master", direction: "down", distance: 1 },
    ],
  } satisfies UatCandidate,
} as const;

/** Deterministic comparison candidates retained from the provisional search. */
export const uatAlternates = {
  tuklas: [
    { candidateId: "tuklas-cf72f89d-65", exactMinimum: 18, scrambleSeed: 0xcf72f89d, scrambleSteps: 65 },
    { candidateId: "tuklas-8b2e6988-23", exactMinimum: 10, scrambleSeed: 0x8b2e6988, scrambleSteps: 23 },
    { candidateId: "tuklas-3c51915c-72", exactMinimum: 10, scrambleSeed: 0x3c51915c, scrambleSteps: 72 },
    { candidateId: "tuklas-5d9f256c-21", exactMinimum: 10, scrambleSeed: 0x5d9f256c, scrambleSteps: 21 },
  ],
  unawa: [
    { candidateId: "unawa-790e635e-159", exactMinimum: 21, scrambleSeed: 0x790e635e, scrambleSteps: 159 },
    { candidateId: "unawa-822d5052-150", exactMinimum: 24, scrambleSeed: 0x822d5052, scrambleSteps: 150 },
    { candidateId: "unawa-c0b11d05-111", exactMinimum: 19, scrambleSeed: 0xc0b11d05, scrambleSteps: 111 },
    { candidateId: "unawa-83f46b04-153", exactMinimum: 23, scrambleSeed: 0x83f46b04, scrambleSteps: 153 },
  ],
  kilos: [
    { candidateId: "kilos-411700fe-418", exactMinimum: 24, scrambleSeed: 0x411700fe, scrambleSteps: 418 },
    { candidateId: "kilos-dfcc4418-364", exactMinimum: 27, scrambleSeed: 0xdfcc4418, scrambleSteps: 364 },
    { candidateId: "kilos-f0f0d781-313", exactMinimum: 25, scrambleSeed: 0xf0f0d781, scrambleSteps: 313 },
    { candidateId: "kilos-3ffdba7f-414", exactMinimum: 24, scrambleSeed: 0x3ffdba7f, scrambleSteps: 414 },
  ],
} as const satisfies Record<PuzzleLevel["id"], readonly UatAlternate[]>;

/** Returns a fresh local-only fixture only when the Vite UAT flag is enabled. */
export function isUatModeEnabled(value: string | undefined): boolean {
  return value === "true";
}

export function getUatCandidate(tier: PuzzleLevel["id"], enabled: boolean): UatCandidate | undefined {
  if (!enabled) return undefined;
  const candidate = uatCandidates[tier];
  return { ...candidate, pieces: candidate.pieces.map((piece) => ({ ...piece })), solution: candidate.solution.map((move) => ({ ...move })) };
}
