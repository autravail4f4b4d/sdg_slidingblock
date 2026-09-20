import "./styles.css";
import "@fontsource/bricolage-grotesque/latin-600.css";
import "@fontsource/bricolage-grotesque/latin-800.css";
import "@fontsource/source-serif-4/latin-400.css";
import "@fontsource/source-serif-4/latin-600.css";
import { getProductionPool, getProductionVariant, productionTiers, type ProductionLevelVariant, type ProductionTier } from "./data/productionLevels";
import { getUatCandidate, isUatModeEnabled, type UatCandidate } from "./data/candidateLevels";
import { getSDG } from "./data/sdgs";
import { applyMove, getMaxTravel, targetCanExit } from "./game/movement";
import { getHintMove } from "./game/hint";
import { formatTime, resultLabel } from "./game/scoring";
import { newGame, recordMove, resetGame, setHint, undo } from "./game/state";
import { getBestScore, saveBestScore } from "./game/storage";
import { getNextVariant } from "./game/replay";
import type { Direction, GameState, Move, PuzzlePiece } from "./game/types";
import { registerServiceWorker } from "./pwa/registerServiceWorker";

const app = document.querySelector<HTMLDivElement>("#app")!;
type UatPlayableLevel = UatCandidate & { tier: ProductionTier; variantId: string };
type PlayableLevel = ProductionLevelVariant | UatPlayableLevel;
const uatMode = isUatModeEnabled(import.meta.env.VITE_UAT_MODE);
let activeLevel: PlayableLevel | null = null;
let game: GameState | null = null;
let ticker = 0;
type Drag = {
  piece: PuzzlePiece;
  pointerId: number;
  direction: Direction | null;
  distance: number;
  escape: boolean;
  board: HTMLElement;
  button: HTMLButtonElement;
  startX: number;
  startY: number;
  translateX: number;
  translateY: number;
  frame: number | null;
};
let drag: Drag | null = null;

function elapsed(): number { return !game ? 0 : game.startedAt ? game.elapsedMs + Date.now() - game.startedAt : game.elapsedMs; }
function updateClock() { const timer = document.querySelector("[data-timer]"); if (timer) timer.textContent = formatTime(elapsed()); }
function setStatus(status: GameState["status"]) { if (!game) return; game = { ...game, status }; render(); }
function nextVariant(tier: ProductionTier): ProductionLevelVariant | undefined {
  const variantId = getNextVariant(tier, getProductionPool(tier).map((variant) => variant.variantId));
  return variantId ? getProductionVariant(tier, variantId) : undefined;
}
function getUatVariant(tier: ProductionTier): UatPlayableLevel | undefined {
  const candidate = getUatCandidate(tier, uatMode);
  return candidate ? { ...candidate, tier, variantId: candidate.candidateId } : undefined;
}
function selectTier(tier: ProductionTier) {
  if (activeLevel?.tier === tier && game && game.status !== "won") { setStatus("instructions"); return; }
  const variant = uatMode ? getUatVariant(tier) : nextVariant(tier);
  if (!variant) return;
  activeLevel = variant;
  game = newGame(activeLevel);
  setStatus("instructions");
}
function chooseHint() { if (!activeLevel || !game) return; game = setHint(game, getHintMove(activeLevel, game.pieces)); renderBoard(); }
/** Restart is deliberately variant-stable; only playAgain consumes a bag item. */
function restart() { if (!activeLevel) return; game = resetGame(activeLevel); game.status = "playing"; render(); }
function playAgain() {
  if (!activeLevel) return;
  const variant = uatMode ? getUatVariant(activeLevel.tier) : nextVariant(activeLevel.tier);
  if (!variant) { game = null; activeLevel = null; render(); return; }
  activeLevel = variant;
  game = newGame(activeLevel);
  game.status = "playing";
  render();
}
function finish() { if (!activeLevel || !game) return; game = { ...game, status: "won", elapsedMs: elapsed() ?? game.elapsedMs, startedAt: null }; saveBestScore(activeLevel.id, { moves: game.moves, elapsedMs: game.elapsedMs }, activeLevel.variantId); render(); }

function pieceMarkup(piece: PuzzlePiece) {
  if (!game) return "";
  const sdg = piece.sdg ? getSDG(piece.sdg) : null;
  const label = sdg ? `SDG ${sdg.number}: ${sdg.title}` : "Sustainable Development Goals, target tile";
  const width = (piece.width / 6) * 100; const height = (piece.height / 6) * 100;
  const left = (piece.x / 6) * 100; const top = (piece.y / 6) * 100;
  const hint = game.hint?.pieceId === piece.id ? " is-hinted" : "";
  const compact = piece.width === 1 && piece.height === 1 ? " tile-compact" : "";
  const body = piece.target
    ? `<span class="wheel" aria-hidden="true"></span><span class="master-copy">SUSTAINABLE<br>DEVELOPMENT<br>GOALS</span>`
    : `<img class="tile-icon" src="${sdg!.iconPath}" alt="" aria-hidden="true" onerror="this.remove();this.parentElement?.classList.add('tile-icon-failed')"><strong>${sdg!.number}</strong><span class="tile-title">${sdg!.shortTitle}</span>`;
  return `<button class="tile ${piece.target ? "tile-master" : ""}${compact}${hint}" data-piece="${piece.id}" aria-label="${label}" style="--x:${left}%;--y:${top}%;--w:${width}%;--h:${height}%;--tile:${sdg?.color ?? "#f6f1e5"}">${body}</button>`;
}

function renderBoard() {
  if (!game) return;
  const board = document.querySelector<HTMLElement>(".board-grid"); if (!board) return;
  board.innerHTML = game.pieces.map(pieceMarkup).join("");
  board.querySelectorAll<HTMLButtonElement>("[data-piece]").forEach((tile) => tile.addEventListener("pointerdown", onPointerDown));
  const moves = document.querySelector("[data-moves]"); if (moves) moves.textContent = String(game.moves);
  const undoButton = document.querySelector<HTMLButtonElement>("[data-undo]"); if (undoButton) undoButton.disabled = game.history.length === 0;
}

function onPointerDown(event: PointerEvent) {
  if (!activeLevel || !game || game.status !== "playing" || drag || !event.isPrimary) return;
  const button = event.currentTarget as HTMLButtonElement;
  const piece = game.pieces.find((entry) => entry.id === button.dataset.piece); const board = button.closest<HTMLElement>(".board-grid");
  if (!piece || !board) return;
  event.preventDefault(); button.setPointerCapture(event.pointerId); button.classList.add("is-active");
  drag = {
    piece, pointerId: event.pointerId, direction: null, distance: 0, escape: false, board, button,
    startX: event.clientX, startY: event.clientY, translateX: 0, translateY: 0, frame: null,
  };
  const move = (next: PointerEvent) => onPointerMove(next);
  const end = (next: PointerEvent) => {
    onPointerUp(next, next.type === "pointercancel");
    button.removeEventListener("pointermove", move);
    button.removeEventListener("pointerup", end);
    button.removeEventListener("pointercancel", end);
  };
  button.addEventListener("pointermove", move); button.addEventListener("pointerup", end); button.addEventListener("pointercancel", end);
}

function paintDrag(current: Drag) {
  current.frame = null;
  current.button.style.transform = `translate3d(${current.translateX}px, ${current.translateY}px, 0) scale(1.015)`;
}

function onPointerMove(event: PointerEvent) {
  if (!activeLevel || !game || !drag || event.pointerId !== drag.pointerId) return;
  const rect = drag.board.getBoundingClientRect(); const cell = rect.width / 6;
  const dx = event.clientX - drag.startX; const dy = event.clientY - drag.startY;
  const direction: Direction = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
  const isExit = Boolean(drag.piece.target && direction === "down" && targetCanExit(game.pieces, activeLevel));
  const max = isExit ? 1 : getMaxTravel(drag.piece.id, direction, game.pieces, activeLevel);
  const raw = Math.abs(direction === "left" || direction === "right" ? dx : dy);
  const pixels = Math.min(raw, max * cell); const distance = Math.min(max, Math.round(raw / cell));
  drag.direction = direction; drag.distance = distance; drag.escape = isExit && raw > cell * .35;
  drag.translateX = direction === "left" ? -pixels : direction === "right" ? pixels : 0;
  drag.translateY = direction === "up" ? -pixels : direction === "down" ? pixels : 0;
  if (drag.frame === null) drag.frame = window.requestAnimationFrame(() => { if (drag) paintDrag(drag); });
}

function clearDragVisual(current: Drag) {
  if (current.frame !== null) window.cancelAnimationFrame(current.frame);
  current.button.classList.remove("is-active");
  current.button.style.transition = "";
  current.button.style.transform = "";
  if (current.button.hasPointerCapture(current.pointerId)) current.button.releasePointerCapture(current.pointerId);
}

function onPointerUp(event: PointerEvent, cancelled: boolean) {
  if (!activeLevel || !game || !drag || event.pointerId !== drag.pointerId) return;
  const current = drag; drag = null;
  if (cancelled || !current.direction || current.distance === 0) { clearDragVisual(current); return; }
  if (current.escape) { clearDragVisual(current); finish(); return; }

  game = recordMove(game, applyMove(current.piece.id, current.direction, current.distance, game.pieces, activeLevel));
  const rect = current.board.getBoundingClientRect(); const cell = rect.width / 6;
  const snap = current.distance * cell;
  const snapX = current.direction === "left" ? -snap : current.direction === "right" ? snap : 0;
  const snapY = current.direction === "up" ? -snap : current.direction === "down" ? snap : 0;
  if (current.frame !== null) window.cancelAnimationFrame(current.frame);
  current.button.classList.remove("is-active");
  current.button.style.transition = "transform 150ms cubic-bezier(.2,.8,.2,1)";
  window.requestAnimationFrame(() => { current.button.style.transform = `translate3d(${snapX}px, ${snapY}px, 0)`; });
  if (current.button.hasPointerCapture(current.pointerId)) current.button.releasePointerCapture(current.pointerId);
  window.setTimeout(() => { current.button.style.transition = ""; current.button.style.transform = ""; renderBoard(); }, 150);
}

function boardScreen() {
  if (!activeLevel || !game) { menuScreen(); return; }
  const best = getBestScore(activeLevel.id, activeLevel.variantId);
  app.innerHTML = `<main class="game-shell"><section class="wood-frame" aria-label="SDG Escape game"><header class="game-header"><div><h1>SDG ESCAPE <span>—</span> UNLOCK 2030</h1><p>${activeLevel.name} <i>·</i> ${activeLevel.description}</p></div><div class="status"><span>MOVES <b data-moves>${game.moves}</b></span><span>TIME <b data-timer>${formatTime(elapsed())}</b></span></div></header><section class="tray-wrap"><div class="tray"><div class="board-grid" aria-label="6 by 6 sliding puzzle board"></div></div><div class="exit"><span>▼</span> 2030 <span>▼</span></div></section><footer class="frame-footer"><span class="leaf">❦</span><strong>17 Goals. One Shared Future.</strong><span class="leaf">❦</span></footer></section><nav class="wood-controls" aria-label="Game controls"><button data-undo aria-label="Undo last move">↶<small>Undo</small></button><button data-restart aria-label="Restart level">↻<small>Restart</small></button><button data-hint aria-label="Show a hint">☀<small>Hint</small></button></nav><p class="best-line">${best ? `Best ${best.moves} moves · ${formatTime(best.elapsedMs)}` : "Move each tile in any clear direction."}</p></main>`;
  renderBoard();
  document.querySelector<HTMLButtonElement>("[data-undo]")!.addEventListener("click", () => { if (game) game = undo(game); renderBoard(); });
  document.querySelector<HTMLButtonElement>("[data-restart]")!.addEventListener("click", restart);
  document.querySelector<HTMLButtonElement>("[data-hint]")!.addEventListener("click", chooseHint);
}

function menuScreen() {
  const availableTiers = uatMode ? productionTiers : productionTiers.filter((tier) => getProductionPool(tier).length > 0);
  app.innerHTML = `<main class="start-shell"><section class="start-card"><p class="eyebrow">A sliding puzzle for the 17 Goals</p><h1>SDG ESCAPE</h1><h2>Unlock 2030</h2><p>Slide the 17 Goals to create a path for Sustainable Development</p><div class="level-list">${availableTiers.map((tier) => {
    const level = uatMode ? getUatVariant(tier)! : getProductionPool(tier)[0];
    return `<button data-level="${tier}"><b>${level.name}</b><span>${level.description}</span></button>`;
  }).join("")}</div><p class="small-note">17 Goals. One Shared Future.</p></section></main>`;
  app.querySelectorAll<HTMLButtonElement>("[data-level]").forEach((button) => button.addEventListener("click", () => selectTier(button.dataset.level as ProductionTier)));
}

function instructionScreen() {
  if (!activeLevel || !game) { menuScreen(); return; }
  app.innerHTML = `<main class="start-shell"><section class="start-card instructions"><p class="eyebrow">${activeLevel.name} · ${activeLevel.description}</p><h1>Make room for 2030</h1><ol><li>Slide each tile along its clear channel</li><li>Keep every tile inside the wooden tray</li><li>Guide the white Goals tile through the 2030 exit</li></ol><button class="primary" data-start>START</button><button class="text-button" data-back>Choose another level</button></section></main>`;
  app.querySelector("[data-start]")!.addEventListener("click", () => setStatus("playing")); app.querySelector("[data-back]")!.addEventListener("click", () => setStatus("menu"));
}

function winScreen() {
  if (!activeLevel || !game) { menuScreen(); return; }
  const best = getBestScore(activeLevel.id, activeLevel.variantId);
  const nextTier = productionTiers[productionTiers.indexOf(activeLevel.tier) + 1];
  const next = nextTier ? (uatMode ? getUatVariant(nextTier) : getProductionPool(nextTier)[0]) : undefined;
  app.innerHTML = `<main class="start-shell"><section class="start-card win-card"><p class="eyebrow">${resultLabel(game.moves, activeLevel.minimumMoves)}</p><h1>2030 UNLOCKED</h1><div class="goals-mark"><span>17 GOALS</span><b>↓</b><span>ONE SHARED FUTURE</span></div><p>Sustainable development depends on progress across interconnected goals.</p><div class="score"><span>MOVES <b>${game.moves}</b></span><span>TIME <b>${formatTime(game.elapsedMs)}</b></span>${best ? `<span>BEST <b>${best.moves}</b></span>` : ""}</div><button class="primary" data-again>PLAY AGAIN</button>${next ? `<button class="text-button" data-next>TRY ${next.name}</button>` : `<button class="text-button" data-menu>CHOOSE A LEVEL</button>`}</section></main>`;
  app.querySelector("[data-again]")!.addEventListener("click", playAgain); const nextButton = app.querySelector<HTMLButtonElement>("[data-next]"); if (nextButton && nextTier) nextButton.addEventListener("click", () => selectTier(nextTier)); app.querySelector<HTMLButtonElement>("[data-menu]")?.addEventListener("click", () => setStatus("menu"));
}
function render() { window.clearInterval(ticker); if (!game || game.status === "menu") menuScreen(); else if (game.status === "instructions") instructionScreen(); else if (game.status === "won") winScreen(); else { boardScreen(); ticker = window.setInterval(updateClock, 1000); } }
registerServiceWorker(); render();
