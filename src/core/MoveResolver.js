import { elementRules } from '../entities/Piece.js';
const MAX_CASCADE_WAVES = 200;

/**
 * Матчи разрешаются последовательно; предел каскадов защищает от бесконечной цепочки.
 * @param {import("../core/Game.js").Game} game
 * @returns {Promise<void>}
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
 * @param {import("../core/Game.js").Game} game
 * @param {number} firstIndex
 * @param {number} secondIndex
 * @returns {boolean}
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
 * Сохраняет результат команды до финального события, чтобы интерфейс и интеграции
 * получили актуальную причину через снимок состояния.
 * @param {import('../core/Game.js').Game} game - Текущая игровая сессия.
 * @param {'swap'|'activate'} type - Тип команды.
 * @param {boolean} accepted - Была ли команда принята.
 * @param {string} reason - Стабильный код результата.
 * @returns {boolean} Значение результата публичной команды.
 */
function recordCommand(game, type, accepted, reason) {
  game.lastCommand = { type, accepted, reason };
  return accepted;
}

/**
 * Принятый обмен расходует один ход и ожидает каскады; недопустимый обмен возвращается без расхода хода.
 * @param {import("../core/Game.js").Game} game
 * @param {number} firstIndex
 * @param {number} secondIndex
 * @returns {Promise<boolean>}
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
       * @param {number} index
       * @returns {boolean}
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
 * @param {import("../core/Game.js").Game} game
 * @param {number} firstIndex
 * @param {number} secondIndex
 * @param {import("../types.js").Match[]} matches
 * @returns {Promise<void>}
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
 * @param {import("../core/Game.js").Game} game
 * @param {number} index
 * @returns {Promise<boolean>}
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
 * После каскадов ящики меняют цвет один раз; победа проверяется раньше поражения, затем восстанавливаются ходы.
 * @param {import("../core/Game.js").Game} game
 * @returns {Promise<void>}
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
       * @param {import("../types.js").Cell} piece
       * @returns {boolean}
       */ (piece) => piece?.kind === 'booster',
    ) &&
    !game.legalMoves().length
  )
    await game.shuffle();
  await game.emit('ready');
}
