import { elementRules } from '../entities/Piece.js';
const MAX_CASCADE_WAVES = 200;

/**
 * Описание операции или проверяемого поведения.
 * @param {import("../core/Game.js").Game} game - Параметр операции.
 * @returns Результат выполнения операции.
 */
export async function resolveBoard(game) {
  let chain = 0;
  while (true) {
    const matches = game.findMatches();
    if (!matches.length) return;
    if (++chain > MAX_CASCADE_WAVES) throw new Error('Слишком длинный каскад');
    await game.emit('cascade', { chain });
    await game.wave(matches);
  }
}

/**
 * Описание операции или проверяемого поведения.
 * @param {import("../core/Game.js").Game} game - Параметр операции.
 * @param {number} firstIndex - Параметр операции.
 * @param {number} secondIndex - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function canSwap(game, firstIndex, secondIndex) {
  return (
    !game.busy &&
    game.status === 'playing' &&
    game.adjacent(firstIndex).includes(secondIndex) &&
    Boolean(game.movable(firstIndex)) &&
    Boolean(game.movable(secondIndex))
  );
}

/**
 * Описание операции или проверяемого поведения.
 * Описание операции или проверяемого поведения.
 * @param {import('../core/Game.js').Game} game - Параметр операции.
 * @param {'swap'|'activate'} type - Параметр операции.
 * @param {boolean} accepted - Параметр операции.
 * @param {string} reason - Параметр операции.
 * @returns Результат выполнения операции.
 */
function recordCommand(game, type, accepted, reason) {
  game.lastCommand = { type, accepted, reason };
  return accepted;
}

/**
 * Описание операции или проверяемого поведения.
 * @param {import("../core/Game.js").Game} game - Параметр операции.
 * @param {number} firstIndex - Параметр операции.
 * @param {number} secondIndex - Параметр операции.
 * @returns Результат выполнения операции.
 */
export async function resolveMove(game, firstIndex, secondIndex) {
  if (game.busy) return recordCommand(game, 'swap', false, 'BUSY');
  if (game.status !== 'playing') return recordCommand(game, 'swap', false, 'INVALID_STATUS');
  if (!game.adjacent(firstIndex).includes(secondIndex))
    return recordCommand(game, 'swap', false, 'NOT_ADJACENT');
  if (!game.movable(firstIndex) || !game.movable(secondIndex))
    return recordCommand(game, 'swap', false, 'IMMOVABLE');
  game.busy = true;
  try {
    game.field.swap(firstIndex, secondIndex);
    await game.emit('swap');
    const matches = game.findMatches();
    const hasBooster = [firstIndex, secondIndex].some(
      /**
       * Описание операции или проверяемого поведения.
       * @param {number} index - Параметр операции.
       * @returns Результат выполнения операции.
       */ (index) => game.board[index].kind === 'booster',
    );
    if (!hasBooster && !matches.length) {
      game.field.swap(firstIndex, secondIndex);
      recordCommand(game, 'swap', false, 'NO_MATCH');
      await game.emit('invalid');
      return false;
    }
    game.moves--;
    game.preferred = [secondIndex, firstIndex];
    await resolveSwap(game, firstIndex, secondIndex, matches);
    recordCommand(game, 'swap', true, 'SUCCESS');
    await finishTurn(game);
    return true;
  } finally {
    game.busy = false;
  }
}

/**
 * Описание операции или проверяемого поведения.
 * @param {import("../core/Game.js").Game} game - Параметр операции.
 * @param {number} firstIndex - Параметр операции.
 * @param {number} secondIndex - Параметр операции.
 * @param {import("../types.js").Match[]} matches - Параметр операции.
 * @returns Результат выполнения операции.
 */
async function resolveSwap(game, firstIndex, secondIndex, matches) {
  const firstPiece = game.board[firstIndex];
  const secondPiece = game.board[secondIndex];
  if (firstPiece.kind === 'booster' && secondPiece.kind === 'booster') {
    await game.wave([], [], { a: firstIndex, b: secondIndex });
    return;
  }
  if (firstPiece.kind !== 'booster' && secondPiece.kind !== 'booster') {
    await game.wave(matches);
    return;
  }
  const boosterIndex = firstPiece.kind === 'booster' ? firstIndex : secondIndex;
  const partner = boosterIndex === firstIndex ? secondPiece : firstPiece;
  await game.wave([], [{ i: boosterIndex, color: partner.kind === 'gem' ? partner.color : null }]);
}

/**
 * Описание операции или проверяемого поведения.
 * @param {import("../core/Game.js").Game} game - Параметр операции.
 * @param {number} index - Параметр операции.
 * @returns Результат выполнения операции.
 */
export async function activateBooster(game, index) {
  if (game.busy) {
    return recordCommand(game, 'activate', false, 'BUSY');
  }
  if (game.status !== 'playing') {
    return recordCommand(game, 'activate', false, 'INVALID_STATUS');
  }
  if (game.board[index]?.kind !== 'booster') {
    return recordCommand(game, 'activate', false, 'NOT_BOOSTER');
  }
  game.busy = true;
  try {
    game.moves--;
    await game.wave([], [{ i: index }]);
    recordCommand(game, 'activate', true, 'SUCCESS');
    await finishTurn(game);
    return true;
  } finally {
    game.busy = false;
  }
}

/**
 * Описание операции или проверяемого поведения.
 * @param {import("../core/Game.js").Game} game - Параметр операции.
 * @returns Результат выполнения операции.
 */
export async function finishTurn(game) {
  await resolveBoard(game);
  game.turn++;
  for (const piece of game.board) {
    if (piece?.kind === 'box') elementRules.get(piece.type)?.afterTurn?.(piece, game.level.colors);
  }
  if (game.won()) game.status = 'won';
  else if (game.moves <= 0) game.status = 'lost';
  else if (
    !game.board.some(
      /**
       * Описание операции или проверяемого поведения.
       * @param {import("../types.js").Cell} piece - Параметр операции.
       * @returns Результат выполнения операции.
       */ (piece) => piece?.kind === 'booster',
    ) &&
    !game.legalMoves().length
  )
    await game.shuffle();
  await game.emit('ready');
}
