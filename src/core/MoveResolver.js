import { elementRules } from '../entities/Piece.js';
const MAX_CASCADE_WAVES = 200;

/**
 * Матчи разрешаются последовательно; предел каскадов защищает от бесконечной цепочки.
 * @param {import("../core/Game.js").Game} game - Current game session.
 * @returns {Promise<void>} Completes the operation.
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
 * Checks session state, adjacency and whether both cells can be exchanged without changing the board.
 * @param {import("../core/Game.js").Game} game - Current game session.
 * @param {number} firstIndex - First cell index.
 * @param {number} secondIndex - Second cell index.
 * @returns {boolean} Result of the described operation.
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
 * Принятый обмен расходует один ход и ожидает каскады; недопустимый обмен возвращается без расхода хода.
 * @param {import("../core/Game.js").Game} game - Current game session.
 * @param {number} firstIndex - First cell index.
 * @param {number} secondIndex - Second cell index.
 * @returns {Promise<boolean>} Result of the described operation.
 */
export async function resolveMove(game, firstIndex, secondIndex) {
  if (!canSwap(game, firstIndex, secondIndex)) return false;
  game.busy = true;
  try {
    game.field.swap(firstIndex, secondIndex);
    await game.emit('swap');
    const matches = game.findMatches();
    const hasBooster = [firstIndex, secondIndex].some(
      /**
       * Detects a booster in the exchanged cells.
       * @param {number} index - Row-major cell position.
       * @returns {boolean} Callback result used by the enclosing operation.
       */ (index) => game.board[index].kind === 'booster',
    );
    if (!hasBooster && !matches.length) {
      game.field.swap(firstIndex, secondIndex);
      await game.emit('invalid');
      return false;
    }
    game.moves--;
    game.preferred = [secondIndex, firstIndex];
    await resolveSwap(game, firstIndex, secondIndex, matches);
    await finishTurn(game);
    return true;
  } finally {
    game.busy = false;
  }
}

/**
 * Selects a match wave, single activation or booster combination for the accepted swap.
 * @param {import("../core/Game.js").Game} game - Current game session.
 * @param {number} firstIndex - First cell index.
 * @param {number} secondIndex - Second cell index.
 * @param {import("../types.js").Match[]} matches - Detected matches.
 * @returns {Promise<void>} Completes the operation.
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
 * Consumes one move to activate a booster and finish its cascades; releases the busy flag even on failure.
 * @param {import("../core/Game.js").Game} game - Current game session.
 * @param {number} index - Row-major cell position.
 * @returns {Promise<boolean>} Result of the described operation.
 */
export async function activateBooster(game, index) {
  if (game.busy || game.status !== 'playing' || game.board[index]?.kind !== 'booster') return false;
  game.busy = true;
  try {
    game.moves--;
    await game.wave([], [{ i: index }]);
    await finishTurn(game);
    return true;
  } finally {
    game.busy = false;
  }
}

/**
 * После каскадов ящики меняют цвет один раз; победа проверяется раньше поражения, затем восстанавливаются ходы.
 * @param {import("../core/Game.js").Game} game - Current game session.
 * @returns {Promise<void>} Completes the operation.
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
       * Detects a booster that can provide an activation without reshuffling.
       * @param {import("../types.js").Cell} piece - Current element.
       * @returns {boolean} Callback result used by the enclosing operation.
       */ (piece) => piece?.kind === 'booster',
    ) &&
    !game.legalMoves().length
  )
    await game.shuffle();
  await game.emit('ready');
}
