import { gem, elementRules } from '../entities/Piece.js';
const INITIAL_BOARD_ATTEMPTS = 500;
const MATCH_REPAIR_ATTEMPTS = 200;
const SHUFFLE_ATTEMPTS = 1000;
/**
 * Подбирает случайные клетки без стартовых матчей и с допустимым ходом; заданные клетки сохраняет. При исчерпании попыток сообщает об ошибке.
 * @param {import("../core/Game.js").Game} game - Текущая игровая сессия.
 * @returns {void} Завершает операцию.
 */
export function initializeBoard(game) {
  const fixed = new Set();
  for (let index = 0; index < game.board.length; index++) {
    const cell = game.level.map?.[index];
    if (cell !== undefined && cell !== null && cell !== '?') {
      validateElement(cell, index);
      game.board[index] = typeof cell === 'number' ? gem(cell) : game.clone(cell);
      fixed.add(index);
    }
  }

  for (let attempt = 0; attempt < INITIAL_BOARD_ATTEMPTS; attempt++) {
    for (let index = 0; index < game.board.length; index++)
      if (!fixed.has(index)) game.board[index] = gem(game.rand(game.level.colors));
    for (let pass = 0; pass < MATCH_REPAIR_ATTEMPTS; pass++) {
      const matches = game.findMatches();
      if (!matches.length) break;
      for (const group of matches) {
        const editable = group.cells.filter(
          /**
           * Выбирает клетки, цвет которых можно изменить при исправлении расстановки.
           * @param {number} index - Индекс клетки в порядке строк.
           * @returns {boolean} Результат проверки.
           */ (index) => !fixed.has(index),
        );
        if (!editable.length) throw new Error('Карта содержит неизбежный стартовый матч');
        const index = editable[game.rand(editable.length)];
        game.board[index] = gem(game.rand(game.level.colors));
      }
    }

    if (!game.findMatches().length && game.legalMoves().length) return;
  }

  throw new Error('Не удалось создать игровое поле без матчей');
}

/**
 * Rejects unregistered obstacle strategies before a level starts.
 * @param {number|string|import('../types.js').Piece} item @param {number} index
 */
function validateElement(item, index) {
  if (!item || typeof item !== 'object') return;
  if (item.kind === 'box' && !elementRules.has(item.type)) {
    throw new TypeError(`Unknown element type "${item.type}" at board index ${index}`);
  }
  if (item.contains) validateElement(item.contains, index);
}

/**
 * Перемешивает фишки, при необходимости подбирает цвета заново; ящики неподвижны, завершение анимации обязательно.
 * @param {import("../core/Game.js").Game} game - Текущая игровая сессия.
 * @returns {Promise<void>} Завершает операцию.
 */
export async function shuffleBoard(game) {
  const ids = game.board
    .map(
      /**
       * Выбирает индексы фишек, сохраняя ящики на месте.
       * @param {import("../types.js").Cell} piece - Текущий элемент.
       * @param {number} index - Индекс клетки в порядке строк.
       * @returns {*} Результат callback-функции.
       */ (piece, index) => (piece?.kind === 'gem' ? index : -1),
    )
    .filter(
      /**
       * Отбрасывает позиции ящиков.
       * @param {number} index - Индекс клетки в порядке строк.
       * @returns {boolean} Результат проверки.
       */ (index) => index >= 0,
    );
  for (let attempt = 0; attempt < SHUFFLE_ATTEMPTS; attempt++) {
    for (let remainingIndex = ids.length - 1; remainingIndex > 0; remainingIndex--) {
      const swapIndex = game.rand(remainingIndex + 1);
      [game.board[ids[remainingIndex]], game.board[ids[swapIndex]]] = [
        game.board[ids[swapIndex]],
        game.board[ids[remainingIndex]],
      ];
    }

    if (!game.findMatches().length && game.legalMoves().length) {
      await game.emit('shuffle');
      return;
    }
  }

  // При неподходящем составе цветов перестановки не помогут — нужно заново подобрать цвета.
  for (let attempt = 0; attempt < SHUFFLE_ATTEMPTS; attempt++) {
    for (const index of ids) game.board[index] = gem(game.rand(game.level.colors));
    if (!game.findMatches().length && game.legalMoves().length) {
      await game.emit('shuffle');
      return;
    }
  }

  throw new Error('Карта не допускает доступных ходов');
}
