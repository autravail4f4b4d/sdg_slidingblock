export const formatTime = (elapsedMs: number) => `${String(Math.floor(elapsedMs / 60000)).padStart(2, "0")}:${String(Math.floor(elapsedMs / 1000) % 60).padStart(2, "0")}`;
export const resultLabel = (moves: number, optimal?: number) => !optimal || moves <= optimal + 5 ? "EXCELLENT" : moves <= optimal + 15 ? "GREAT" : "COMPLETED";
